import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { clientConfig } from './config';

export const app = initializeApp(clientConfig);
export const db = getFirestore(app);
