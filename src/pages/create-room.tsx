import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoomSchema, joinRoomSchema, type CreateRoomInput, type JoinRoomInput } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"new" | "join">("new");
  const { toast } = useToast();

  const createForm = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: "" },
  });

  const joinForm = useForm<JoinRoomInput>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { name: "", roomCode: "" },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      const response = await apiRequest("POST", "/api/rooms", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Save user data to localStorage for persistence
      const user = {
        id: data.user?.id || Math.random().toString(36).substr(2, 9),
        name: data.user?.name || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user?.name || 'user'}`,
        isHost: true
      };
      localStorage.setItem('vibe_user', JSON.stringify(user));
      navigate(`/room/${data.room.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: JoinRoomInput) => {
      const response = await apiRequest("POST", "/api/rooms/join", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Save user data to localStorage for persistence
      const user = {
        id: data.user?.id || Math.random().toString(36).substr(2, 9),
        name: data.user?.name || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user?.name || 'user'}`,
        isHost: false
      };
      localStorage.setItem('vibe_user', JSON.stringify(user));
      navigate(`/room/${data.room.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Room not found or invalid code.",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateRoomInput) => {
    createRoomMutation.mutate(data);
  };

  const onJoinSubmit = (data: JoinRoomInput) => {
    joinRoomMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#3a3a3a] relative overflow-hidden">

      {/* About us button */}
      <div className="absolute top-8 right-8 z-50">
        <button className="flex items-center gap-4 bg-[#3a3a3a] text-white pl-6 pr-2 py-2 rounded-full transition-all border backdrop-blur-md group pointer-events-auto shadow-xl hover:shadow-2xl border-white/10 hover:border-white/20">
          <span className="font-montserrat text-sm font-normal text-gray-200">About us</span>
          <div className="w-8 h-8 rounded-full bg-[#4a4a4a] flex items-center justify-center group-hover:bg-[#5a5a5a] transition-colors">
             <User className="w-4 h-4 text-gray-300 group-hover:text-white" />
          </div>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-20">
        {/* VIBEONE Logo */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white tracking-wider mb-3 animate-fade-in"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}
          data-testid="text-vibeone-logo"
        >
          VIBEONE
        </h1>

        {/* Tagline */}
        <p
          className="text-white/60 text-sm tracking-wide mb-12 animate-fade-in"
          data-testid="text-tagline"
        >
          Powered by Logical Loops
        </p>

        {/* Form Section */}
        <div className="w-full max-w-md animate-slide-up">
          <p className="text-center text-white/70 text-sm mb-6" data-testid="text-form-title">
            {mode === "new" ? "Create new room" : "Instant, private conversations."}
          </p>

          {/* Toggle Buttons */}
          <div className="toggle-group w-full max-w-xs mx-auto mb-8">
            <button
              onClick={() => setMode("new")}
              data-testid="button-toggle-new"
              className={`toggle-btn flex-1 justify-center ${mode === "new" ? "active" : ""}`}
            >
              <User className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              onClick={() => setMode("join")}
              data-testid="button-toggle-join"
              className={`toggle-btn flex-1 justify-center ${mode === "join" ? "active" : ""}`}
            >
              <Users className="w-4 h-4" />
              <span>Join</span>
            </button>
          </div>

          {/* Form Fields */}
          {mode === "new" ? (
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <input
                type="text"
                placeholder="Enter your name"
                data-testid="input-name"
                className="glass-input w-full border-white/10"
                {...createForm.register("name")}
              />
              {createForm.formState.errors.name && (
                <p className="text-red-400 text-xs mt-1 text-center">
                  {createForm.formState.errors.name.message}
                </p>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  data-testid="button-create-room"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-3 font-medium transition-all duration-300 disabled:opacity-50"
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-6">
              <input
                type="text"
                placeholder="Enter your name"
                data-testid="input-name"
                className="glass-input w-full"
                {...joinForm.register("name")}
              />
              {joinForm.formState.errors.name && (
                <p className="text-red-400 text-xs mt-1 text-center">
                  {joinForm.formState.errors.name.message}
                </p>
              )}

              <input
                type="text"
                placeholder="Enter room code"
                data-testid="input-room-code"
                className="glass-input w-full"
                maxLength={6}
                {...joinForm.register("roomCode")}
              />
              {joinForm.formState.errors.roomCode && (
                <p className="text-red-400 text-xs mt-1 text-center">
                  {joinForm.formState.errors.roomCode.message}
                </p>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={joinRoomMutation.isPending}
                  data-testid="button-join-room"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 py-3 font-medium transition-all duration-300 disabled:opacity-50"
                >
                  {joinRoomMutation.isPending ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Start Your Journey Section */}
        {/* <div className="mt-20 pb-24 text-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2
            className="text-xl md:text-2xl font-bold text-white tracking-wider mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}
            data-testid="text-start-journey"
          >
            START YOUR JOURNEY
          </h2>
          <p className="text-white/50 text-sm max-w-xs mx-auto">
            Connect, chat and stream together - music, movie
            and new friends await.
          </p>
        </div> */}
      </div>
    </div>
  );
}
