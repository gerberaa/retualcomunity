// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgT1kAkK4Hs6iNYwdRCvswSZFmYtz_gDY",
  authDomain: "spark-3eb38.firebaseapp.com",
  projectId: "spark-3eb38",
  storageBucket: "spark-3eb38.appspot.com",
  messagingSenderId: "477226498867",
  appId: "1:477226498867:web:YOUR_APP_ID" // This will be configured later if needed
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service and storage
const db = firebase.firestore();
const storage = firebase.storage();
