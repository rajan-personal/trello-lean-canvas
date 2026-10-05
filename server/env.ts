export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  HYPERDRIVE?: { connectionString: string }
  DATABASE_URL?: string
  DATA_BACKEND?: string
  WRITES_ENABLED?: string
  AUTH_REGISTRATION_ENABLED?: string
  BETTER_AUTH_URL?: string
  BETTER_AUTH_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}
export interface Principal { id: string; name: string; kind: 'user' | 'agent'; projectKey?: string }

