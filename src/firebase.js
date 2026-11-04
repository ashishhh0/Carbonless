import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const cfg = {
  apiKey: 'AIzaSyCeFx0WfKfeYysCPjCCgJ7O2YgOSwlM_7k',
  authDomain: 'carbonlessa.firebaseapp.com',
  projectId: 'carbonlessa',
  storageBucket: 'carbonlessa.firebasestorage.app',
  messagingSenderId: '403718025009',
  appId: '1:403718025009:web:f4d6791407689ceeb54a10'
}
export const app = initializeApp(cfg)
export const auth = getAuth(app)
// Offline-capable cache: trips logged without network sync automatically when back online.
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
export const googleProvider = new GoogleAuthProvider()
