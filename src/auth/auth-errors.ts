export function authMessage(error: unknown, fallback = 'Sign-in failed. Please try again.'): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'Google sign-in was cancelled. Please try again.'
  if (code.includes('popup-blocked')) return 'Allow pop-ups and try again.'
  if (code.includes('unauthorized-domain')) return 'This site is not authorized for Google sign-in.'
  if (['invalid-credential', 'invalid-login-credentials', 'wrong-password', 'user-not-found', 'invalid-email'].some((value) => code.endsWith(value)))
    return 'Email or password is incorrect. You can also continue with Google.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.'
  if (code.includes('network-request-failed')) return 'Check your connection and try again.'
  if (code.includes('user-disabled')) return 'This account has been disabled.'
  if (code.includes('user-mismatch')) return 'Choose the Google account you are currently signed in with.'
  if (code.includes('weak-password') || code.includes('password-does-not-meet-requirements'))
    return 'Choose a stronger password that meets your account’s password requirements.'
  if (code.includes('credential-already-in-use') || code.includes('email-already-in-use'))
    return 'This email is already linked to another account. Continue with Google.'
  if (code.includes('requires-recent-login')) return 'Please verify your Google account again and retry.'
  if (code.includes('operation-not-allowed')) return 'Email sign-in is not enabled yet. Please continue with Google.'
  return fallback
}
