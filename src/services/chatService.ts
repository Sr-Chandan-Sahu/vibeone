import { db } from './firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Message, User } from '../utils/types';

const ROOMS_COLLECTION = 'rooms';

export const subscribeToMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, ROOMS_COLLECTION, roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as Message);
    callback(messages);
  });
};

export const saveMessage = async (roomId: string, message: Message) => {
  const messageRef = doc(db, ROOMS_COLLECTION, roomId, 'messages', message.id);
  await setDoc(messageRef, message);
};

export const subscribeToParticipants = (roomId: string, callback: (participants: User[]) => void) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.participants || []);
    } else {
      callback([]);
    }
  });
};

export const addParticipant = async (roomId: string, user: User) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  try {
    await setDoc(roomRef, {
      participants: [user],
      lastUpdated: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error adding participant:', error);
  }
};

export const removeParticipant = async (roomId: string, userId: string) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  try {
    const docSnap = await (await import('firebase/firestore')).getDoc(roomRef);
    if (docSnap.exists()) {
      const participants = (docSnap.data().participants || []).filter(
        (p: User) => p.id !== userId
      );
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(roomRef, { participants });
    }
  } catch (error) {
    console.error('Error removing participant:', error);
  }
};
