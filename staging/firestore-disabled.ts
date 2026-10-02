// Local repositories import remote modules, but never call them. Fail closed
// if a future change accidentally selects a remote repository in this demo.
const disabled = () => { throw new Error('Cloud storage is disabled in this staging demo.') }
export const getFirestore = () => Object.freeze({ staging: true })
export const collection = disabled
export const doc = disabled
export const getDocFromServer = disabled
export const getDocsFromServer = disabled
export const onSnapshot = disabled
export const runTransaction = disabled
export const serverTimestamp = disabled
export const writeBatch = disabled
export const limit = disabled
export const query = disabled
export const where = disabled
