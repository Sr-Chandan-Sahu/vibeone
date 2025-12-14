import { db } from '@/services/firebase';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { CreateRoomInput, JoinRoomInput } from '@shared/schema';

// Generate a 6-character room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new room
export async function createRoom(input: CreateRoomInput) {
  try {
    let roomCode = generateRoomCode();
    let exists = true;
    
    // Ensure unique room code
    while (exists) {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        exists = false;
      } else {
        roomCode = generateRoomCode();
      }
    }

    // Create room document
    const roomRef = doc(db, 'rooms', roomCode);
    const userId = Math.random().toString(36).substr(2, 9);
    
    await setDoc(roomRef, {
      code: roomCode,
      createdAt: Timestamp.now(),
      host: {
        id: userId,
        name: input.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.name}`,
      },
      members: [
        {
          id: userId,
          name: input.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.name}`,
          joinedAt: Timestamp.now(),
        },
      ],
      messageCount: 0,
      lastActivity: Timestamp.now(),
    });

    return {
      room: { code: roomCode, id: roomCode },
      user: {
        id: userId,
        name: input.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.name}`,
      },
      members: [
        {
          id: userId,
          name: input.name,
          avatarColor: 'bg-blue-600',
        },
      ],
    };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

// Join an existing room
export async function joinRoom(input: JoinRoomInput) {
  try {
    const roomRef = doc(db, 'rooms', input.roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    const userId = Math.random().toString(36).substr(2, 9);
    const newMember = {
      id: userId,
      name: input.name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.name}`,
      joinedAt: Timestamp.now(),
    };

    // Add member to room
    const updatedMembers = [...(roomData.members || []), newMember];
    await setDoc(
      roomRef,
      {
        members: updatedMembers,
        lastActivity: Timestamp.now(),
      },
      { merge: true }
    );

    return {
      room: { code: input.roomCode, id: input.roomCode },
      user: {
        id: userId,
        name: input.name,
        avatar: newMember.avatar,
      },
      members: updatedMembers.map((m) => ({
        id: m.id,
        name: m.name,
        avatarColor: 'bg-blue-600',
      })),
    };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

// Get room info
export async function getRoomInfo(roomCode: string) {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    return {
      room: { code: roomCode, id: roomCode, createdAt: roomData.createdAt },
      members: roomData.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        avatarColor: 'bg-blue-600',
      })),
    };
  } catch (error) {
    console.error('Error fetching room:', error);
    throw error;
  }
}
