import { z } from "zod";

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const insertRoomSchema = z.object({
  code: z.string().length(6),
});

export const insertRoomMemberSchema = z.object({
  roomId: z.string(),
  name: z.string(),
  avatarColor: z.string(),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

export const joinRoomSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  roomCode: z.string().length(6, "Room code must be 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertRoomMember = z.infer<typeof insertRoomMemberSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

// Mock types for Select (what would come from DB)
export interface User extends InsertUser {
  id: string;
}

export interface Room extends InsertRoom {
  id: string;
  createdAt: Date | null;
}

export interface RoomMember extends InsertRoomMember {
  id: string;
  joinedAt: Date | null;
}
