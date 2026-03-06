import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { PromptItem } from '../types';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PROMPTS_COLLECTION = 'prompts';
const SETTINGS_COLLECTION = 'settings';
const DELETED_IDS_DOC = 'deleted_ids';

export const savePrompt = async (prompt: Omit<PromptItem, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, PROMPTS_COLLECTION), {
    ...prompt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getPrompts = async (): Promise<PromptItem[]> => {
  const q = query(collection(db, PROMPTS_COLLECTION), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt
    } as PromptItem;
  });
};

export const updatePrompt = async (id: string, updates: Partial<PromptItem>): Promise<void> => {
  const docRef = doc(db, PROMPTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deletePrompt = async (id: string): Promise<void> => {
  const docRef = doc(db, PROMPTS_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getDeletedIds = async (): Promise<string[]> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, DELETED_IDS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().ids || [];
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const saveDeletedIds = async (ids: string[]): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, DELETED_IDS_DOC);
    await setDoc(docRef, { ids });
  } catch (e) {
    console.error('Error saving deleted ids:', e);
  }
};


const FAVORITES_DOC = 'favorites';

export const getFavoriteIds = async (): Promise<string[]> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FAVORITES_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().ids || [];
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const saveFavoriteIds = async (ids: string[]): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FAVORITES_DOC);
    await setDoc(docRef, { ids });
  } catch (e) {
    console.error('Error saving favorite ids:', e);
  }
};
