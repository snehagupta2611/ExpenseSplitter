import {getAnalytics} from 'firebase/analytics';
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyByT2i3oUBhPpbHxermte5i-S6sAoOB0eM',
  authDomain: 'expensesplitter11.firebaseapp.com',
  projectId: 'expensesplitter11',
  storageBucket: 'expensesplitter11.firebasestorage.app',
  messagingSenderId: '361076144080',
  appId: '1:361076144080:web:2cc6bf1453450b1bcf6bd5',
  measurementId: 'G-WWBWB4D5L2'
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;