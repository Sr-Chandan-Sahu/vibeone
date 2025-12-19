import { db } from './firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import type { Message, MusicState, User } from '../utils/types';

const ROOMS_COLLECTION = 'rooms';

// --- Messages ---

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

// --- Music Sync ---

export const subscribeToMusicState = (roomId: string, callback: (state: MusicState) => void) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.musicState) {
        callback(data.musicState as MusicState);
      }
    }
  });
};

export const updateMusicState = async (roomId: string, newState: Partial<MusicState>) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);

  // Construct dot notation updates for nested fields
  const updates: any = {};
  for (const [key, value] of Object.entries(newState)) {
    updates[`musicState.${key}`] = value;
  }

  // Ensure room exists (merge: true handles creation if missing, but we want to update)
  // We use setDoc with merge to ensure the document exists and we can write to it
  await setDoc(roomRef, { lastUpdated: Date.now() }, { merge: true });

  if (Object.keys(updates).length > 0) {
    await updateDoc(roomRef, updates);
  }
};

// --- Participants ---

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
  await setDoc(roomRef, { participants: arrayUnion(user) }, { merge: true });
};

export const removeParticipant = async (roomId: string, userId: string) => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(roomRef);
      if (!sfDoc.exists()) {
        return;
      }

      const data = sfDoc.data();
      const participants = data.participants as User[] || [];
      const updated = participants.filter(p => p.id !== userId);

      // Only update if changes occurred
      if (participants.length !== updated.length) {
        transaction.update(roomRef, { participants: updated });
      }
    });
  } catch (e) {
    console.error("Remove participant transaction failed: ", e);
  }
};

export const createRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};