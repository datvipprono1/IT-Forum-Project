import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC1R781W4o0i0zGhEShe9zpTp6mapq3BWQ",
  authDomain: "it-forum-766ac.firebaseapp.com",
  projectId: "it-forum-766ac",
  storageBucket: "it-forum-766ac.firebasestorage.app",
  messagingSenderId: "149155899019",
  appId: "1:149155899019:web:5fbc144fbc46d754dcd68e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

let dbInstance = null;
let storageInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }

  return dbInstance;
}

export function getStorageService() {
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }

  return storageInstance;
}

export { app, auth };
