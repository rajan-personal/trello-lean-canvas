CREATE TABLE auth_user (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified boolean NOT NULL DEFAULT false,
 image text, disabled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE auth_session (
 id text PRIMARY KEY, token text NOT NULL UNIQUE, user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 ip_address text, user_agent text);
CREATE INDEX auth_session_user_idx ON auth_session(user_id);
CREATE TABLE auth_account (
 id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
 user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 access_token text, refresh_token text, id_token text, access_token_expires_at timestamptz,
 refresh_token_expires_at timestamptz, scope text, password text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider_id,account_id));
CREATE INDEX auth_account_user_idx ON auth_account(user_id);
CREATE TABLE auth_verification (
 id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX auth_verification_identifier_idx ON auth_verification(identifier);
CREATE TABLE auth_rate_limit (id text PRIMARY KEY, key text NOT NULL UNIQUE, count integer NOT NULL, last_request bigint NOT NULL);
CREATE TABLE workspaces (
 owner_id text PRIMARY KEY REFERENCES auth_user(id), order_revision integer NOT NULL DEFAULT 1,
 change_revision integer NOT NULL DEFAULT 1, CHECK(order_revision > 0 AND change_revision > 0));
CREATE TABLE projects (
 key uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id text NOT NULL REFERENCES workspaces(owner_id),
 id text NOT NULL CHECK(octet_length(id) BETWEEN 1 AND 1500), payload jsonb NOT NULL,
 position integer NOT NULL CHECK(position >= 0), revision integer NOT NULL DEFAULT 1,
 board_revision integer NOT NULL DEFAULT 1, activity jsonb, source_metadata jsonb,
 UNIQUE(owner_id,id), CHECK(revision > 0 AND board_revision > 0));
CREATE INDEX projects_order_idx ON projects(owner_id,position);
CREATE TABLE board_columns (
 key uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_key uuid NOT NULL REFERENCES projects(key) ON DELETE CASCADE,
 id text NOT NULL CHECK(octet_length(id) BETWEEN 1 AND 1500), title text NOT NULL,
 position integer NOT NULL CHECK(position >= 0), UNIQUE(project_key,id), UNIQUE(project_key,key));
CREATE TABLE tickets (
 key uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_key uuid NOT NULL REFERENCES projects(key) ON DELETE CASCADE,
 id text NOT NULL CHECK(octet_length(id) BETWEEN 1 AND 1500), parent_key uuid, column_key uuid NOT NULL,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 500), description text NOT NULL CHECK(length(description) <= 100000),
 story_points integer CHECK(story_points IN (1,3,5,8,13)), rank text COLLATE "C" NOT NULL CHECK(rank ~ '^[0-9a-z]*[1-9a-z]$' AND length(rank) <= 2048),
 UNIQUE(project_key,id), UNIQUE(project_key,key),
 FOREIGN KEY(project_key,parent_key) REFERENCES tickets(project_key,key) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(project_key,column_key) REFERENCES board_columns(project_key,key) DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT ticket_sibling_rank UNIQUE NULLS NOT DISTINCT (project_key,parent_key,column_key,rank) DEFERRABLE INITIALLY DEFERRED,
 CHECK(parent_key IS DISTINCT FROM key));
CREATE INDEX tickets_parent_idx ON tickets(project_key,parent_key);
CREATE INDEX tickets_column_idx ON tickets(project_key,column_key);
CREATE TABLE comments (
 project_key uuid NOT NULL REFERENCES projects(key) ON DELETE CASCADE, id text NOT NULL CHECK(octet_length(id) BETWEEN 1 AND 1500),
 ticket_key uuid NOT NULL, author_id text NOT NULL, author_name text NOT NULL,
 author_type text CHECK(author_type IN ('user','agent')), text text NOT NULL CHECK(length(text) BETWEEN 1 AND 10000),
 created_at text NOT NULL, principal_id text, PRIMARY KEY(project_key,id),
 FOREIGN KEY(project_key,ticket_key) REFERENCES tickets(project_key,key) ON DELETE CASCADE);
CREATE INDEX comments_thread_idx ON comments(project_key,ticket_key,created_at,id);
CREATE TABLE command_receipts (
 owner_id text NOT NULL REFERENCES auth_user(id), id text NOT NULL, digest text NOT NULL,
 result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,id));
CREATE TABLE board_imports (
 project_key uuid PRIMARY KEY REFERENCES projects(key) ON DELETE CASCADE, import_id text NOT NULL, digest text NOT NULL);
CREATE TABLE agent_credentials (
 id text PRIMARY KEY, project_key uuid NOT NULL REFERENCES projects(key) ON DELETE CASCADE,
 name text NOT NULL, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz);
CREATE TABLE password_challenges (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 session_id text NOT NULL REFERENCES auth_session(id) ON DELETE CASCADE,
 verifier text NOT NULL, expires_at timestamptz NOT NULL, verified boolean NOT NULL DEFAULT false);
CREATE TABLE migration_records (
 source_key text PRIMARY KEY, checksum text NOT NULL, imported_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE api_rate_limits (key text PRIMARY KEY, window_start bigint NOT NULL, count integer NOT NULL);

CREATE TABLE app_schema_version (version integer PRIMARY KEY);
INSERT INTO app_schema_version VALUES(1);
