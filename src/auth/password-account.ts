import { EmailAuthProvider, GoogleAuthProvider, linkWithCredential, reauthenticateWithPopup, updatePassword, type User } from 'firebase/auth'

export const hasPassword = (user: User) => user.providerData.some(({ providerId }) => providerId === 'password')

/** Attach credentials to the existing UID; never create a second account. */
export async function saveAccountPassword(user: User, password: string): Promise<void> {
  if (!user.email || !user.providerData.some(({ providerId }) => providerId === 'google.com'))
    throw new Error('Sign in with your Google account before setting a password.')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account', login_hint: user.email })
  await reauthenticateWithPopup(user, provider)
  if (hasPassword(user)) await updatePassword(user, password)
  else await linkWithCredential(user, EmailAuthProvider.credential(user.email, password))
}
