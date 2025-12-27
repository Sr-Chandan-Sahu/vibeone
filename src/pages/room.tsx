import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LogOut,
  UserPlus,
  Share,
  QrCode,
  Heart,
  Volume2,
  Shuffle,
  Pause,
  Play,
  SkipForward,
  Volume1,
  Trash2,
  Send,
  Mic,
  Headphones,
  Monitor,
  Search,
  X,
  Loader2,
  Plus,
  MessageSquare
} from "lucide-react";




import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToParticipants,
  addParticipant,
  removeParticipant,
  subscribeToMusicState,
  updateMusicState,
  subscribeToMessages,
  saveMessage
} from "@/services/storageService";
import { searchYoutubeVideos } from "@/services/youtubeService";
import type { User, Message, MusicTrack, MusicState } from "@/utils/types";
import logoImg from "../assets/logo.png";

const avatarColors = [
  "bg-amber-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
];

// YouTube IFrame Player API Types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "audio" | "video" | "chat">("home");


  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [queueTab, setQueueTab] = useState<"queue" | "recent">("queue");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentPlayed, setRecentPlayed] = useState<MusicTrack[]>([]);

  // Music state synced with Firebase
  const [musicState, setMusicState] = useState<MusicState>({
    audio: {
      currentTrack: null,
      isPlaying: false,
      queue: [],
      startedAt: 0,
      pausedAt: 0
    },
    video: {
      currentTrack: null,
      isPlaying: false,
      queue: [],
      startedAt: 0,
      pausedAt: 0
    },
    lastUpdated: 0
  });

  // YouTube Player
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [volume, setVolume] = useState(50);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('vibe_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        navigate('/create');
      }
    } else {
      navigate('/create');
    }
  }, [navigate]);

  // Handle real-time participants
  useEffect(() => {
    if (!currentUser || !params.code) return;

    addParticipant(params.code, currentUser);

    const unsubscribe = subscribeToParticipants(params.code, (users) => {
      setParticipants(users);
    });

    const handleBeforeUnload = () => {
      if (currentUser?.id && params.code) {
        removeParticipant(params.code, currentUser.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Don't remove participant on component unmount (like tab switch), 
      // only on actual page unload or if explicitly leaving.
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
    };
  }, [currentUser, params.code]);

  // Subscribe to music state
  useEffect(() => {
    if (!params.code) return;

    const unsubscribe = subscribeToMusicState(params.code, (state) => {
      setMusicState(state);
    });

    return () => unsubscribe();
  }, [params.code]);

  // Subscribe to messages
  useEffect(() => {
    if (!params.code) return;

    const unsubscribe = subscribeToMessages(params.code, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [params.code]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      initializePlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };
  }, []);

  const initializePlayer = () => {
    if (!playerContainerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '100%',
      width: '100%',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
          playerRef.current.setVolume(volume);
        },
        onStateChange: (event: any) => {
          // When video ends, play next in queue
          if (event.data === window.YT.PlayerState.ENDED) {
            playNextTrack();
          }
        },
        onError: (event: any) => {
          console.error('[Audio Player] Error:', event.data);
        }
      }
    });
  };

  // Sync player with music state
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const audioState = musicState.audio;

    if (audioState.currentTrack) {
      // Logic for background audio player
      // We need to check if the iframe has the right video loaded
      const player = playerRef.current;
      const playerState = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
      const currentVideoId = typeof player.getVideoData === 'function' ? player.getVideoData()?.video_id : null;

      if (currentVideoId !== audioState.currentTrack.id) {
        player.loadVideoById(audioState.currentTrack.id);
      }

      if (audioState.isPlaying) {
        if (playerState !== 1) player.playVideo();
      } else {
        if (playerState === 1) player.pauseVideo();
      }
    } else {
      // No audio track, maybe stop?
      playerRef.current?.pauseVideo();
    }
  }, [musicState.audio, isPlayerReady]);

  const leaveRoom = () => {
    if (currentUser?.id && params.code) {
      removeParticipant(params.code, currentUser.id);
    }
    navigate("/");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const type = activeTab === "audio" ? "audio" : "video";
      const results = await searchYoutubeVideos(searchQuery, type);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Could not search for songs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = async (track: MusicTrack) => {
    if (!params.code || !currentUser) return;

    try {
      const trackWithUser: MusicTrack = {
        ...track,
        addedBy: currentUser.name
      };

      const isAudio = track.type === 'audio';
      const targetKey = isAudio ? 'audio' : 'video';

      // Correct access with safety check
      const targetState = isAudio ? (musicState.audio || { queue: [] }) : (musicState.video || { queue: [] });
      const currentQueue = Array.isArray(targetState.queue) ? targetState.queue : [];

      const newQueue = [...currentQueue, trackWithUser];

      console.log(`Adding to ${targetKey} queue. New length: ${newQueue.length}`);

      // Check if we need to start playing immediately
      if (!targetState.currentTrack) {
        await updateMusicState(params.code, {
          [targetKey]: {
            ...targetState,
            currentTrack: trackWithUser,
            isPlaying: true, // Auto play if nothing was playing
            queue: newQueue.slice(1),
            startedAt: Date.now()
          }
        });
      } else {
        await updateMusicState(params.code, {
          [targetKey]: {
            ...targetState,
            queue: newQueue
          }
        });
      }

      setShowSearchResults(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding to queue:", error);
      toast({
        title: "Error",
        description: "Failed to add to queue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const playTrack = async (track: MusicTrack) => {
    if (!params.code) return;

    // Use current active tab to decide, or track type?
    // Ideally track type determines where it plays.
    const isAudio = track.type === 'audio';
    const targetKey = isAudio ? 'audio' : 'video';
    const targetState = isAudio ? musicState.audio : musicState.video;

    // Auto-pause the OTHER stream if we are starting a new track?
    // Let's implement that for better flow.
    const updates: any = {};

    // Set the new track playing
    updates[targetKey] = {
      ...targetState,
      currentTrack: track,
      isPlaying: true,
      startedAt: Date.now()
    };

    // Pause the other one
    const otherKey = isAudio ? 'video' : 'audio';
    const otherState = isAudio ? musicState.video : musicState.audio;
    if (otherState.isPlaying) {
      updates[otherKey] = {
        ...otherState,
        isPlaying: false,
        pausedAt: Date.now() // rough estimate or 0
      };
    }

    await updateMusicState(params.code, updates);

    // Add current track to recent played
    setRecentPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 10);
    });
  };

  const togglePlayPause = async () => {
    if (!params.code) return;

    // Toggle based on Active Tab?
    const isAudio = activeTab === 'audio';
    const targetKey = isAudio ? 'audio' : 'video';
    const targetState = isAudio ? musicState.audio : musicState.video;

    await updateMusicState(params.code, {
      [targetKey]: {
        ...targetState,
        isPlaying: !targetState.isPlaying,
        pausedAt: targetState.isPlaying ? Date.now() : 0 // timestamp logic needs improvement for robustness
      }
    });
  };

  const playNextTrack = async () => {
    if (!params.code) return;

    // Depends on which tab/player called this.
    // We can assume activeTab or just try both?
    // Usually triggered by the player ending. 
    // If we call this manually, we should check ActiveTab.
    // If called by event (audio end), we should target audio.

    // For manual button click:
    const isAudio = activeTab === 'audio';
    // BUT, wait, if Video ends, we want to play next Video.
    // We need to know context.

    // Let's rely on ActiveTab for now as the buttons are in the tab.
    // If it's an automated call (Video Ended), we might need a separate function or pass a param.
    // Let's stick to ActiveTab for manual clicks.

    const targetKey = isAudio ? 'audio' : 'video';
    const targetState = isAudio ? (musicState.audio || { queue: [] }) : (musicState.video || { queue: [] });
    const currentQueue = Array.isArray(targetState.queue) ? targetState.queue : [];

    // Save to recents
    if (targetState.currentTrack) {
      setRecentPlayed(prev => {
        const filtered = prev.filter(t => t.id !== targetState.currentTrack!.id);
        return [targetState.currentTrack!, ...filtered].slice(0, 10);
      });
    }

    if (currentQueue.length > 0) {
      const [nextTrack, ...remainingQueue] = currentQueue;
      await updateMusicState(params.code, {
        [targetKey]: {
          ...targetState,
          currentTrack: nextTrack,
          queue: remainingQueue,
          isPlaying: true,
          startedAt: Date.now()
        }
      });
    } else {
      // Stop
      await updateMusicState(params.code, {
        [targetKey]: {
          ...targetState,
          currentTrack: null,
          isPlaying: false
        }
      });
    }
  };

  const removeFromQueue = async (trackId: string) => {
    if (!params.code) return;

    // Since queues are separate, we ideally want to know WHICH queue.
    // But ID should be unique enough or we just filter both if we want to be lazy (but safe).
    // Or use activeTab.

    // Let's use ActiveTab to determine which queue we are viewing
    const isAudio = activeTab === 'audio';
    const targetKey = isAudio ? 'audio' : 'video';
    const targetState = isAudio ? (musicState.audio || { queue: [] }) : (musicState.video || { queue: [] });
    const currentQueue = Array.isArray(targetState.queue) ? targetState.queue : [];

    const newQueue = currentQueue.filter(t => t.id !== trackId);

    if (newQueue.length !== targetState.queue.length) {
      await updateMusicState(params.code, {
        [targetKey]: {
          ...targetState,
          queue: newQueue
        }
      });
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentUser || !params.code) return;

    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: params.code,
      sender: currentUser,
      text: messageInput.trim(),
      timestamp: Date.now(),
      type: 'text'
    };

    await saveMessage(params.code, message);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${params.code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Share this link with friends to invite them."
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(params.code || "");
    toast({
      title: "Room Code Copied!",
      description: `Room code: ${params.code}`
    });
  };

  // Show loading while user is being initialized
  if (!currentUser || !params.code) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60 text-lg">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] relative overflow-hidden">
      {/* Hidden YouTube Audio Player - Must have real dimensions for YouTube API to work */}
      <div
        ref={playerContainerRef}
        className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      />
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 py-4">
        {/* Logo - Hide on mobile if showing Room ID at top? Images show Logout & UserPlus on mobile top */}
        <div className="flex items-center gap-3 lg:flex">
          <img src={logoImg} alt="VIBEONE" className="hidden lg:block w-10 h-10" />
          <div className="hidden lg:flex flex-col">
            <span
              className="text-white text-2xl font-bold tracking-wider"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              VIBEONE
            </span>
            <span className="text-white/50 text-[10px] tracking-wide">Powered by Logical Loops</span>
          </div>
        </div>

        {/* Mobile Top Controls */}
        <div className="lg:hidden flex items-center justify-between w-full">
          <button
            onClick={leaveRoom}
            className="p-2 transition-all"
          >
            <LogOut className="w-6 h-6 text-white" />
          </button>

          <div className="flex flex-col items-center">
            <p className="text-white/50 text-[10px] mb-0.5">Room ID</p>
            <h2 className="text-xl font-bold text-white tracking-wider" style={{ fontFamily: "'neomax', sans-serif" }}>
              {params.code}
            </h2>
          </div>

          <button
            onClick={copyRoomCode}
            className="p-2 transition-all"
          >
            <UserPlus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Header content - Desktop About removed as per user request */}

      </header>


      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden">

        {/* Left Sidebar - Desktop only */}
        <aside className="hidden lg:flex w-72 p-6 flex-col">

          {/* Room ID Section */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={leaveRoom}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5 text-white/70" />
            </button>

            <div className="text-center">
              <p className="text-white/50 text-xs mb-1">Room ID</p>
              <h2 className="text-2xl font-bold text-white tracking-wider" style={{ fontFamily: "'neomax', sans-serif" }}>
                {params.code}
              </h2>
            </div>

            <button
              onClick={copyRoomCode}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <UserPlus className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Instant Invite Section */}
          <div className="mb-8">
            <p className="text-white/50 text-xs mb-4">Instant invite</p>
            <div className="flex gap-3">
              <button onClick={copyRoomLink} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all">
                  <Share className="w-4 h-4 text-gray-900" />
                </div>
                <span className="text-xs text-cyan-400 font-medium">Share Link</span>
              </button>
              <button onClick={copyRoomCode} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all">
                  <QrCode className="w-4 h-4 text-gray-900" />
                </div>
                <span className="text-xs text-white/70">Share QR</span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all">
                  <MessageSquare className="w-4 h-4 text-gray-900" />
                </div>
                <span className="text-xs text-white/70">Chat Room</span>
              </button>

            </div>
          </div>

          {/* Room Members */}
          <div className="flex-1">
            <p className="text-white/50 text-xs mb-4">Room members ({participants.length})</p>
            <div className="flex flex-wrap gap-2">
              {participants.length > 0 ? participants.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-2 pr-3 py-1.5"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm">{member.name}</span>
                  {member.isHost && (
                    <span className="text-xs text-yellow-400">👑</span>
                  )}
                </div>
              )) : (
                <p className="text-white/40 text-sm">No members yet</p>
              )}
            </div>
          </div>

          {/* Queue Section - Only show on audio/video tabs */}
          {activeTab === "video" && (
            <div className="mt-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setQueueTab("queue")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${queueTab === "queue"
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-white/70 border border-white/20"
                    }`}
                >
                  Queue ({musicState.video.queue?.length || 0})
                </button>
                <button
                  onClick={() => setQueueTab("recent")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${queueTab === "recent"
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-white/70 border border-white/20"
                    }`}
                >
                  Recent
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {queueTab === "queue" ? (
                  (musicState.video?.queue || []).length > 0 ? (
                    (musicState.video?.queue || []).map((song) => (
                      <div key={song.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2 group">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                          {song.thumbnail ? (
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <Headphones className="w-5 h-5 text-white/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{song.title}</p>
                          <p className="text-green-400 text-xs">Added by {song.addedBy}</p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(song.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white/50 hover:text-red-400" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm text-center py-4">Queue is empty. Search for songs!</p>
                  )
                ) : (
                  recentPlayed.length > 0 ? (
                    recentPlayed.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-3 bg-white/5 rounded-xl p-2 group cursor-pointer hover:bg-white/10"
                        onClick={() => playTrack(song)}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                          {song.thumbnail ? (
                            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <Headphones className="w-5 h-5 text-white/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{song.title}</p>
                          <p className="text-white/50 text-xs">Played recently</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm text-center py-4">No recent tracks</p>
                  )
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto no-scrollbar pb-24 relative">
          {/* Mobile Home Tab */}
          {activeTab === "home" && isMobile && (
            <div className="space-y-8 animate-slide-up">
              {/* Instant Invite */}
              <div className="pt-2">
                <p className="text-white/50 text-sm mb-4 ml-1">Instant invite</p>
                <div className="flex gap-4">
                  <button onClick={copyRoomLink} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
                      <Share className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs text-blue-400 font-medium tracking-tight">Share QR</span>
                  </button>
                  <button onClick={copyRoomCode} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
                      <QrCode className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs text-blue-400">Scan QR</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
                      <MessageSquare className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs text-blue-400">Join Chat</span>
                  </button>


                </div>
              </div>

              {/* Room Members */}
              <div>
                <p className="text-white/50 text-sm mb-4 ml-1">Room members</p>
                <div className="flex flex-wrap gap-3">
                  {participants.length > 0 ? participants.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-[#0d0d0d] border border-white/10 rounded-full pl-1.5 pr-4 py-1.5 shadow-sm"
                    >
                      <Avatar className="w-9 h-9 border-2 border-white/10">
                        <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{member.name}</span>
                    </div>
                  )) : (
                    <p className="text-white/40 text-sm">No members yet</p>
                  )}
                </div>
              </div>

              {/* Mobile Now Playing Mini Player (if any) */}
              {(musicState.audio.currentTrack || musicState.video.currentTrack) && (
                <div className="fixed bottom-28 left-4 right-4 z-40">
                  <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 pr-6 flex items-center gap-4 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img
                        src={musicState.audio.currentTrack?.thumbnail || musicState.video.currentTrack?.thumbnail}
                        alt="Current"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium truncate">
                        {musicState.audio.currentTrack?.title || musicState.video.currentTrack?.title}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Pause className="w-4 h-4 text-white" />
                          <SkipForward className="w-4 h-4 text-white/50" />
                          <Volume2 className="w-4 h-4 text-white/50 ml-1" />
                        </div>
                        <span className="text-white/50 text-[11px] truncate">
                          {musicState.audio.currentTrack?.addedBy || musicState.video.currentTrack?.addedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "audio" && (
            <div className="max-w-lg mx-auto h-full flex flex-col">

              <div className="shrink-0">
                {/* Now Playing Header */}
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-sm">Now Playing</p>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <Heart className="w-5 h-5 text-white/50 hover:text-red-400" />
                  </button>
                </div>

                {/* Album Art / Vinyl */}
                <div className="relative w-40 h-40 mx-auto mb-2">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden`}>
                    {musicState.audio.currentTrack?.thumbnail ? (
                      <img
                        src={musicState.audio.currentTrack.thumbnail}
                        alt={musicState.audio.currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <Headphones className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Song Info */}
                <div className="text-center mb-4">
                  <h3 className="text-white text-sm font-medium mb-1">
                    {musicState.audio.currentTrack?.title || "No track playing"}
                  </h3>
                  <p className="text-green-400 text-xs">
                    {musicState.audio.currentTrack ? `Added by ${musicState.audio.currentTrack.addedBy}` : "Search for a song to start"}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Volume1 className="w-4 h-4 text-white/50" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="w-20 accent-white"
                    />
                  </div>
                  <button className="p-3 hover:bg-white/10 rounded-full transition-all">
                    <Shuffle className="w-5 h-5 text-white/70" />
                  </button>
                  <button
                    onClick={togglePlayPause}
                    disabled={!musicState.audio.currentTrack}
                    className="p-4 bg-white rounded-full hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {musicState.audio.isPlaying ? (
                      <Pause className="w-6 h-6 text-gray-900" />
                    ) : (
                      <Play className="w-6 h-6 text-gray-900" />
                    )}
                  </button>
                  <button
                    onClick={playNextTrack}
                    disabled={(musicState.audio.queue?.length || 0) === 0}
                    className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50"
                  >
                    <SkipForward className="w-5 h-5 text-white/70" />
                  </button>
                  <button className="p-3 hover:bg-white/10 rounded-full transition-all">
                    <Volume2 className="w-5 h-5 text-white/70" />
                  </button>
                </div>

              </div>
              {/* Audio Queue Section - Desktop only */}
              {!isMobile && (
                <div className="flex-1 min-h-0 flex flex-col mt-2">
                  <div className="flex justify-center gap-2 mb-4">
                    <button
                      onClick={() => setQueueTab("queue")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${queueTab === "queue"
                        ? "bg-white text-gray-900"
                        : "bg-white/10 text-white/70 border border-white/20"
                        }`}
                    >
                      Queue ({musicState.audio.queue?.length || 0})
                    </button>
                    <button
                      onClick={() => setQueueTab("recent")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${queueTab === "recent"
                        ? "bg-white text-gray-900"
                        : "bg-white/10 text-white/70 border border-white/20"
                        }`}
                    >
                      Recent
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {queueTab === "queue" ? (
                      (musicState.audio?.queue || []).length > 0 ? (
                        (musicState.audio?.queue || []).map((song) => (
                          <div key={song.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2 group">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                              {song.thumbnail ? (
                                <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <Headphones className="w-5 h-5 text-white/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{song.title}</p>
                              <p className="text-green-400 text-xs">Added by {song.addedBy}</p>
                            </div>
                            <button
                              onClick={() => removeFromQueue(song.id)}
                              className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-white/50 hover:text-red-400" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-white/40 text-sm text-center py-4">Queue is empty. Search for songs!</p>
                      )
                    ) : (
                      recentPlayed.length > 0 ? (
                        recentPlayed.map((song) => (
                          <div
                            key={song.id}
                            className="flex items-center gap-3 bg-white/5 rounded-xl p-2 group cursor-pointer hover:bg-white/10"
                            onClick={() => playTrack(song)}
                          >
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                              {song.thumbnail ? (
                                <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <Headphones className="w-5 h-5 text-white/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{song.title}</p>
                              <p className="text-white/50 text-xs">Played recently</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-white/40 text-sm text-center py-4">No recent tracks</p>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Integrated Search & Chat for Audio */}
              {isMobile && (
                <div className="flex-1 flex flex-col mt-4 min-h-0">
                  {/* Mobile Search Bar */}
                  <div className="flex gap-2 mb-4 shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search Songs"
                      className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/40 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm"
                    >
                      Chat
                    </button>
                  </div>

                  {/* Search Results or Chat Integrated */}
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {showSearchResults ? (
                      <div className="space-y-3">
                        <p className="text-white/50 text-xs mb-2">Search Result</p>
                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => addToQueue(track)}
                            className="flex items-center gap-3 bg-[#121212] border border-white/5 rounded-[24px] p-2 pr-4"
                          >
                            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[13px] font-medium truncate">{track.title}</p>
                              <p className="text-white/40 text-[11px]">Add to queue</p>
                            </div>
                            <div className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.slice(-10).map((msg, idx) => (
                          <div key={msg.id} className="flex gap-3">
                            <Avatar className="w-10 h-10 border border-white/10">
                              <AvatarFallback className={avatarColors[idx % avatarColors.length]}>
                                {msg.sender.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white/50 text-[11px] mb-1">{msg.sender.name}</p>
                              <div className="bg-[#1a1a1a] border border-white/5 rounded-[20px] px-4 py-2.5">
                                <p className="text-white text-[14px]">{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message Input - Only show if not searching */}
                  {!showSearchResults && (
                    <div className="mt-4 flex items-center gap-2 pb-2">
                      <div className="flex-1 flex items-center bg-[#1a1a1a] border border-white/10 rounded-full px-4 py-2.5">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter message"
                          className="flex-1 bg-transparent text-white text-[14px] focus:outline-none"
                        />
                        <Mic className="w-5 h-5 text-blue-400" />
                      </div>
                      <button
                        onClick={sendMessage}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-5 h-5">
                          <path d="M12 19V5M12 5l-7 7m7-7l7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {activeTab === "video" && (
            <div className="max-w-3xl mx-auto">
              {/* Now Playing Header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-sm">Now Playing</p>
                <p className="text-green-400 text-sm">
                  {musicState.video.currentTrack ? `Added by ${musicState.video.currentTrack.addedBy}` : ""}
                </p>
                <button className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <Heart className="w-5 h-5 text-white/50 hover:text-red-400" />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative max-w-lg mx-auto aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-2 overflow-hidden">
                {musicState.video.currentTrack ? (
                  <>
                    <div className="absolute inset-0 z-10 bg-transparent" />
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${musicState.video.currentTrack.id}?autoplay=${musicState.video.isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="rounded-2xl"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Monitor className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40">Search for a video to start watching</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="text-center mb-6">
                <h3 className="text-white text-lg font-medium mb-1">
                  {musicState.video.currentTrack?.title || "No video playing"}
                </h3>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button className="p-3 hover:bg-white/10 rounded-full transition-all">
                  <Volume1 className="w-5 h-5 text-white/70" />
                </button>
                <button className="p-3 hover:bg-white/10 rounded-full transition-all">
                  <Shuffle className="w-5 h-5 text-white/70" />
                </button>
                <button
                  onClick={togglePlayPause}
                  disabled={!musicState.video.currentTrack}
                  className="p-4 bg-white rounded-full hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {musicState.video.isPlaying ? (
                    <Pause className="w-6 h-6 text-gray-900" />
                  ) : (
                    <Play className="w-6 h-6 text-gray-900" />
                  )}
                </button>
                <button
                  onClick={playNextTrack}
                  disabled={(musicState.video.queue?.length || 0) === 0}
                  className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50"
                >
                  <SkipForward className="w-5 h-5 text-white/70" />
                </button>
                <button className="p-3 hover:bg-white/10 rounded-full transition-all">
                  <Volume2 className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Mobile Integrated Search & Chat for Video */}
              {isMobile && (
                <div className="flex-1 flex flex-col mt-4 min-h-0">
                  {/* Mobile Search Bar - reusing the same logic but for video */}
                  <div className="flex gap-2 mb-4 shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search Videos"
                      className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 text-white placeholder:text-white/40 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm"
                    >
                      Chat
                    </button>

                  </div>

                  {/* Search Results or Chat Integrated */}
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {showSearchResults ? (
                      <div className="space-y-3">
                        <p className="text-white/50 text-xs mb-2 ml-1">Search Result</p>
                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => addToQueue(track)}
                            className="flex items-center gap-3 bg-[#121212] border border-white/5 rounded-[24px] p-2 pr-4"
                          >
                            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-[13px] font-medium truncate">{track.title}</p>
                              <p className="text-white/40 text-[11px]">Add to queue</p>
                            </div>
                            <div className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.slice(-10).map((msg, idx) => (
                          <div key={msg.id} className="flex gap-3 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <Avatar className="w-10 h-10 border border-white/10 shadow-sm">
                              <AvatarFallback className={avatarColors[idx % avatarColors.length]}>
                                {msg.sender.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white/50 text-[11px] mb-1 ml-1">{msg.sender.name}</p>
                              <div className="bg-[#1a1a1a] border border-white/5 rounded-[22px] px-4 py-2.5 shadow-md">
                                <p className="text-white text-[14px] leading-snug">{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message Input - Only show if not searching */}
                  {!showSearchResults && (
                    <div className="mt-4 flex items-center gap-2 pb-2">
                      <div className="flex-1 flex items-center bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3 shadow-inner">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter message"
                          className="flex-1 bg-transparent text-white text-[14px] focus:outline-none"
                        />
                        <Mic className="w-5 h-5 text-blue-400" />
                      </div>
                      <button
                        onClick={sendMessage}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-6 h-6">
                          <path d="M12 19V5M12 5l-7 7m7-7l7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && isMobile && (
            <div className="h-screen flex flex-col -mt-4 pb-24">
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pt-4 px-1">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender.id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div className={`flex items-start gap-3 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <Avatar className="w-10 h-10 border border-white/10 flex-shrink-0">
                              <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                                {msg.sender.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col">
                            {!isOwn && <p className="text-white/50 text-[11px] ml-1 mb-1">{msg.sender.name}</p>}
                            <div className={`px-5 py-3 rounded-[24px] ${isOwn
                              ? 'bg-white text-black'
                              : 'bg-[#1a1a1a] text-white border border-white/5 shadow-md'
                              }`}>
                              <p className="text-[14px] leading-relaxed font-medium">{msg.text}</p>
                            </div>
                            <p className={`text-white/30 text-[10px] mt-1.5 ${isOwn ? 'text-right mr-1' : 'text-left ml-1'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar for Mobile Tab */}
              <div className="mt-4 flex items-center gap-2 pb-8">
                <div className="flex-1 flex items-center bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3.5 shadow-inner">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white text-[15px] focus:outline-none"
                  />
                  <Mic className="w-5 h-5 text-blue-400" />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-6 h-6">
                    <path d="M12 19V5M12 5l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Persistent YouTube Player for Audio/Background */}
          <div className="absolute top-0 right-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
            <div ref={playerContainerRef} />
          </div>
        </main>

        {/* Right Sidebar - Chat & Search (Desktop only) */}
        {!isMobile && (activeTab === "audio" || activeTab === "video") && (
          <aside className="w-80 p-6 flex flex-col">

            {/* Search Section */}
            <div className="relative mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={activeTab === "audio" ? "Search Songs" : "Search Videos"}
                    className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 pr-10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-white/50 hover:text-white" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-3 bg-white text-gray-900 rounded-full font-medium text-sm hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/20 rounded-xl overflow-hidden z-50 max-h-64">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => addToQueue(track)}
                        className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {track.thumbnail ? (
                            <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <Headphones className="w-5 h-5 text-white/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{track.title}</p>
                          <p className="text-white/50 text-xs">Click to add to queue</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-white/50 text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Chat</h3>
              <span className="text-white/50 text-xs">{messages.length} messages</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 no-scrollbar">
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isOwn = msg.sender.id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={avatarColors[index % avatarColors.length]}>
                              {msg.sender.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!isOwn && <p className="text-white/50 text-xs mb-1">{msg.sender.name}</p>}
                          <div className={`px-4 py-2 rounded-2xl ${isOwn
                            ? 'bg-white/10 text-white'
                            : 'bg-white/5 text-white'
                            }`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <p className="text-white/30 text-xs mt-1 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/40 text-sm">No messages yet. Say hello!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-white/10 border border-white/20 rounded-full px-4 py-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter message"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none"
                />
                <button className="p-1">
                  <Mic className="w-5 h-5 text-blue-400" />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="p-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/15 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white/70 rotate-45" />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-[35px] p-2">
          {isMobile && (
            <button
              onClick={() => setActiveTab("home")}
              className={`p-4 rounded-full transition-all ${activeTab === "home"
                ? "bg-white text-black shadow-lg"
                : "text-white/70 hover:bg-white/10"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={activeTab === "home" ? "black" : "none"}
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-6 h-6"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setActiveTab("audio")}
            className={`p-4 rounded-full transition-all ${activeTab === "audio"
              ? "bg-white text-black shadow-lg"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <Headphones className="w-6 h-6" strokeWidth={activeTab === "audio" ? 2.5 : 2} />
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`p-4 rounded-full transition-all ${activeTab === "video"
              ? "bg-white text-black shadow-lg"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <Monitor className="w-6 h-6" strokeWidth={activeTab === "video" ? 2.5 : 2} />
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`p-4 rounded-full transition-all ${activeTab === "chat"
              ? "bg-white text-black shadow-lg"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            <MessageSquare className="w-6 h-6" strokeWidth={activeTab === "chat" ? 2.5 : 2} />
          </button>


        </div>
      </div>

    </div>
  );
}
