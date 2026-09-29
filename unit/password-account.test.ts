import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailAuthProvider, linkWithCredential, reauthenticateWithPopup, updatePassword, type User } from 'firebase/auth'
import { saveAccountPassword } from '../src/auth/password-account'
import { authMessage } from '../src/auth/auth-errors'

vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: vi.fn((email, password) => ({ email, password })) },
  GoogleAuthProvider: class { setCustomParameters = vi.fn() },
  linkWithCredential: vi.fn(), reauthenticateWithPopup: vi.fn(), updatePassword: vi.fn(),
}))
const account = (password = false) => ({ uid: 'unchanged-uid', email: 'alex@example.test',
  providerData: [{ providerId: 'google.com' }, ...(password ? [{ providerId: 'password' }] : [])] }) as User
beforeEach(() => vi.clearAllMocks())
describe('Google-linked email credentials', () => {
  it('reauthenticates before linking credentials to the existing user', async () => {
    const user = account()
    await saveAccountPassword(user, 'new-password')
    expect(reauthenticateWithPopup).toHaveBeenCalledWith(user, expect.anything())
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith(user.email, 'new-password')
    expect(linkWithCredential).toHaveBeenCalledWith(user, { email: user.email, password: 'new-password' })
    expect(vi.mocked(reauthenticateWithPopup).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(linkWithCredential).mock.invocationCallOrder[0])
    expect(updatePassword).not.toHaveBeenCalled()
    expect(user.uid).toBe('unchanged-uid')
  })
  it('updates an existing password only after Google verification', async () => {
    const user = account(true)
    await saveAccountPassword(user, 'replacement-password')
    expect(updatePassword).toHaveBeenCalledWith(user, 'replacement-password')
    expect(linkWithCredential).not.toHaveBeenCalled()
    expect(vi.mocked(reauthenticateWithPopup).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(updatePassword).mock.invocationCallOrder[0])
  })
  it.each(['auth/user-mismatch', 'auth/popup-closed-by-user', 'auth/network-request-failed'])('does not mutate credentials after %s', async (code) => {
    vi.mocked(reauthenticateWithPopup).mockRejectedValueOnce({ code })
    await expect(saveAccountPassword(account(), 'new-password')).rejects.toEqual({ code })
    expect(linkWithCredential).not.toHaveBeenCalled()
    expect(updatePassword).not.toHaveBeenCalled()
  })
  it('does not allow password-only accounts to change credentials', async () => {
    const user = { ...account(), providerData: [{ providerId: 'password' }] } as User
    await expect(saveAccountPassword(user, 'new-password')).rejects.toThrow('Google account')
    expect(reauthenticateWithPopup).not.toHaveBeenCalled()
  })
  it.each(['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'])('does not disclose account existence for %s', (code) => {
    expect(authMessage({ code })).toBe('Email or password is incorrect. You can also continue with Google.')
  })
})
