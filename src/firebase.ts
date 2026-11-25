import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  enableMultiTabIndexedDbPersistence, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling enabled to handle connectivity issues in constrained environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Enable Firestore Offline Persistence for a truly offline-capable applet
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore multi-tab offline persistence enabled.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        enableIndexedDbPersistence(db)
          .then(() => {
            console.log("Firestore single-tab offline persistence fallback enabled.");
          })
          .catch((err2) => {
            console.warn("Firestore offline persistence fallback failed:", err2);
          });
      } else if (err.code === 'unimplemented') {
        console.warn("The browser lacks support for Firestore offline persistence.");
      } else {
        console.warn("Firestore offline persistence error:", err);
      }
    });
}


// CRITICAL CONSTRAINT: When the application initially boots, call getFromServer to test the connection.
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
}

testConnection();
