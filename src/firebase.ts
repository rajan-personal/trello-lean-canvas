import { getApp, getApps, initializeApp } from 'firebase/app'

const defaults = {
  apiKey: 'AIzaSyDYB4nf_67br-KJCuVpkih82Hv5tIjDvH4',
  authDomain: 'trello-lean-canvas-7kvrv.firebaseapp.com',
  projectId: 'trello-lean-canvas-7kvrv',
  storageBucket: 'trello-lean-canvas-7kvrv.firebasestorage.app',
  messagingSenderId: '1312097539',
  appId: '1:1312097539:web:af6a8b27b8e985c493d536',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaults.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaults.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaults.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaults.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    defaults.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaults.appId,
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig)
