# Email sign-in

New accounts are created through **Continue with Google**. The same screen offers email/password sign-in for existing accounts. After Google sign-in, expand your email in the sidebar and choose **Set password**. Once saved this becomes **Change password**. **Sign out** is in the same account menu. Both actions verify the current Google account in a popup before changing credentials. If a password is forgotten, continue with Google and change it inside the workspace.

The password credential is linked to the existing Firebase user, preserving their UID and all workspace data. Later changes update that same user. Passwords are handled by Firebase Authentication, never saved in Firestore or local storage. The form requires at least eight characters; additional Firebase password policy requirements are enforced by Firebase and reported in the form. Cancelling verification or choosing a different Google account leaves credentials unchanged.

## Deployment

Deploy the checked-in Authentication configuration with `npm run deploy:firebase` using the existing release process. `firebase.json` enables `emailPassword` alongside Google. This PR does not deploy the configuration. Until it is deployed, Google remains usable and email operations report that email sign-in is not enabled. Retain existing authorized domains and verify the release/preview hostname is authorized for Google popup authentication.

## Signup policy scope

Google-only signup is enforced in the app flow: there is no email signup form or `createUserWithEmailAndPassword` call, and the app rejects sessions without a linked Google provider. Enabling Firebase's email/password provider also enables its direct signup API. The client guard is not a server security boundary and does not prevent direct API account creation. If strict backend Google-only account creation is required, configure an Identity Platform `beforeCreate` blocking function to reject password-only creation; that requires an infrastructure/billing decision and is outside this client-only change. Existing Firestore UID ownership rules remain in place.

## Verification

- Unit tests verify Google reauthentication precedes link/update, the existing user is passed through unchanged, failures do not mutate credentials, and credential errors do not reveal account existence.
- Browser Storybook tests cover email sign-in, Google-only signup guidance, optional password help, password confirmation, verification cancellation, pending controls, success, and account-menu keyboard navigation, dismissal, bounds, and focus restoration.
- Screenshots use synthetic users and Storybook callbacks. They do not represent a production Google OAuth or Firebase credential exchange.

Release smoke test with a dedicated Google test account: create/sign in with Google, set a password, sign out, sign in with email, verify the same projects, change the password, and confirm old-password rejection and new-password/Google success. This requires deployed provider configuration and interactive Google verification.

References: [link providers](https://firebase.google.com/docs/auth/web/account-linking), [manage passwords](https://firebase.google.com/docs/auth/web/manage-users), [blocking functions](https://firebase.google.com/docs/auth/extend-with-blocking-functions).
