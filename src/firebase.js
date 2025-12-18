// Import the functions you need from the SDKs you need
import {getAnalytics} from 'firebase/analytics';
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';            // Required for Login/Sign-up
import {getFirestore} from 'firebase/firestore';  // Required for Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyByT2i3oUBhPpbHxermte5i-S6sAoOB0eM',
  authDomain: 'expensesplitter11.firebaseapp.com',
  projectId: 'expensesplitter11',
  storageBucket: 'expensesplitter11.firebasestorage.app',
  messagingSenderId: '361076144080',
  appId: '1:361076144080:web:2cc6bf1453450b1bcf6bd5',
  measurementId: 'G-WWBWB4D5L2'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and Export services
// These names MUST match what your other files are importing
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;