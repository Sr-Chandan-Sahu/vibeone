import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, Headphones, MessageCircle, Monitor, LogOut, User as UserIcon, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ChatPanel } from "@/components/ChatPanel";
import { MusicPlayer } from "@/components/MusicPlayer";
import { subscribeToParticipants, addParticipant, removeParticipant } from "@/services/storageService";
import type { User} from "@/utils/types";

const avatarColors = [
  "bg-amber-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-orange-600",
];

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "audio" | "chat" | "screen">("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);

  // Initialize user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('vibe_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        // If stored user is invalid, navigate to create room
        navigate('/create');
      }
    } else {
      navigate('/create');
    }
  }, [navigate]);

  // Handle real-time participants
  useEffect(() => {
    if (!currentUser || !params.code) return;

    // Add self to participants
    addParticipant(params.code, currentUser);

    const unsubscribe = subscribeToParticipants(params.code, (users) => {
      setParticipants(users);
    });

    return () => {
      if (currentUser?.id) {
        removeParticipant(params.code!, currentUser.id);
      }
      unsubscribe();
    };
  }, [currentUser, params.code]);

  const copyRoomCode = () => {
    if (params.code) {
      navigator.clipboard.writeText(params.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    }
  };

  const leaveRoom = () => {
    navigate("/");
  };

  // Show loading while user is being initialized
  if (!currentUser || !params.code) {
    return (
      <div className="min-h-screen vibeone-gradient flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vibeone-gradient relative overflow-hidden flex">
      {/* Light beam effect */}
      <div className="light-beam" />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />

      {/* About us button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          data-testid="button-about-us"
          className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-white/90 text-sm font-medium transition-all duration-300 hover:bg-white/15"
        >
          About us
          <UserIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Panel - shown when active tab is chat */}
      {activeTab === "chat" && currentUser && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:static lg:w-96 lg:bg-transparent lg:backdrop-blur-none">
          <div className="absolute right-0 top-0 h-full w-full lg:relative lg:w-96">
            <ChatPanel user={currentUser} roomId={params.code || ''} onClose={() => setActiveTab('home')} />
          </div>
        </div>
      )}

      {/* Music Player - shown when active tab is audio */}
      {activeTab === "audio" && currentUser && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:static lg:w-96 lg:bg-transparent lg:backdrop-blur-none">
          <div className="absolute right-0 top-0 h-full w-full lg:relative lg:w-96">
            <MusicPlayer 
              roomId={params.code || ''} 
              user={currentUser}
              onClose={() => setActiveTab('home')} 
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex-1 px-6 py-6 pb-28 overflow-y-auto">
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold text-white tracking-wider"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}
              data-testid="text-vibeone-logo"
            >
              VIBEONE
            </h1>
            <p className="text-white/50 text-xs mt-1">Powered by Logical Loops</p>
          </div>
        </div>

        {/* Room Info Section */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={leaveRoom}
            data-testid="button-leave-room"
            className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all hover:bg-white/15"
          >
            <LogOut className="w-5 h-5 text-white/70" />
          </button>

          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">Room ID</p>
            <div className="flex items-center gap-2 justify-center">
              <h2
                className="text-xl font-bold text-white tracking-wider"
                data-testid="text-room-code"
              >
                {params.code}
              </h2>
              <button
                onClick={copyRoomCode}
                data-testid="button-copy-code"
                className="text-white/50 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">Instant, private conversations.</p>
          </div>

          <button
            data-testid="button-invite"
            className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl transition-all hover:bg-white/15"
          >
            <UserIcon className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Left Panel - Headphones Image */}
          <div className="glass-card p-4 aspect-square flex flex-col items-center justify-center">
            <p className="text-white/60 text-xs text-center">
              Listen together - enjoy millions of songs,
              <br />
              anytime, anywhere.
            </p>
          </div>

          {/* Right Panel - Placeholder */}
          <div className="glass-card aspect-square flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 rounded-2xl" />
          </div>
        </div>

        {/* Room Members Section */}
        <div className="mb-8">
          <h3
            className="text-lg font-bold text-white tracking-wider mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}
            data-testid="text-room-members-title"
          >
            ROOM MEMBERS
          </h3>
          <div className="flex flex-wrap gap-3">
            {participants.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-3 pr-4 py-2"
                data-testid={`member-badge-${member.id}`}
              >
                <span className="text-white text-sm">{member.name}</span>
                <Avatar className="w-7 h-7">
                  <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </div>

        {/* Start Your Journey Section */}
        <div className="text-center mb-8">
          <h2
            className="text-lg font-bold text-white tracking-wider mb-2"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}
            data-testid="text-start-journey"
          >
            START YOUR JOURNEY
          </h2>
          <p className="text-white/50 text-xs max-w-xs mx-auto">
            Connect, chat and stream together - music, movie
            and new friends await.
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2">
          <button
            onClick={() => setActiveTab("home")}
            data-testid="nav-home"
            className={`p-3 rounded-full transition-all ${activeTab === "home"
              ? "bg-white text-gray-900"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            data-testid="nav-audio"
            className={`p-3 rounded-full transition-all ${activeTab === "audio"
              ? "bg-white text-gray-900"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <Headphones className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            data-testid="nav-chat"
            className={`p-3 rounded-full transition-all ${activeTab === "chat"
              ? "bg-white text-gray-900"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("screen")}
            data-testid="nav-screen"
            className={`p-3 rounded-full transition-all ${activeTab === "screen"
              ? "bg-white text-gray-900"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
