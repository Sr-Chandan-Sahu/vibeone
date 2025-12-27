import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Search, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchYoutubeVideos } from '@/services/youtubeService';
import { subscribeToMusicState, updateMusicState } from '@/services/storageService';
import type { MusicTrack, PlaybackState, User } from '@/utils/types';

interface MusicPlayerProps {
  roomId?: string;
  user?: User;
  onClose?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function MusicPlayer({ roomId, user, onClose }: MusicPlayerProps) {
  const [state, setState] = useState<PlaybackState>({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    startedAt: 0,
    pausedAt: 0
  });

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [volume, setVolume] = useState(100);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Check if current user is host
  const isHost = user?.isHost ?? false;

  // Define handleNext with useCallback so it can be referenced in event handlers
  const handleNext = useCallback(async () => {
    if (!roomId || !isHost) return;

    try {
      if (state.queue.length === 0) {
        // No more tracks
        await updateMusicState(roomId, {
          audio: {
            currentTrack: null,
            isPlaying: false,
            queue: []
          }
        });
        return;
      }

      const nextTrack = state.queue[0];
      const remainingQueue = state.queue.slice(1);

      await updateMusicState(roomId, {
        audio: {
          currentTrack: nextTrack,
          isPlaying: true,
          startedAt: Date.now(),
          queue: remainingQueue
        }
      });
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }, [roomId, isHost, state.queue]);

  const handlePlayPause = useCallback(async () => {
    if (!roomId || !isHost || !state.currentTrack) return;

    try {
      const newIsPlaying = !state.isPlaying;

      await updateMusicState(roomId, {
        audio: {
          isPlaying: newIsPlaying,
          startedAt: newIsPlaying ? Date.now() : state.startedAt,
          pausedAt: !newIsPlaying ? playerRef.current?.getCurrentTime?.() ?? 0 : state.pausedAt
        }
      });
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [roomId, isHost, state.isPlaying, state.currentTrack, state.startedAt, state.pausedAt]);

  const handlePrev = useCallback(async () => {
    if (!roomId || !isHost) return;

    try {
      const currentIndex = state.queue.findIndex(t => t.id === state.currentTrack?.id);
      if (currentIndex > 0) {
        const prevTrack = state.queue[currentIndex - 1];
        await updateMusicState(roomId, {
          audio: {
            currentTrack: prevTrack,
            isPlaying: true,
            startedAt: Date.now()
          }
        });
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  }, [roomId, isHost, state.queue, state.currentTrack]);

  // Initialize State from Firebase
  useEffect(() => {
    if (!roomId) return;

    try {
      const unsubscribe = subscribeToMusicState(roomId, (musicState) => {
        // Extract the audio playback state from the full music state
        const audioState = musicState.audio;
        setState(audioState);
        syncPlayer(audioState);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to music state:', error);
    }
  }, [roomId]);

  // Initialize YouTube Player
  useEffect(() => {
    const initPlayer = () => {
      if (!playerContainerRef.current) {
        console.error('Player container ref not available');
        return;
      }

      if (!window.YT || !window.YT.Player) {
        console.error('YouTube IFrame API not loaded');
        return;
      }

      // Prevent re-initialization if already exists
      if (playerRef.current) {
        console.log('Player already initialized');
        return;
      }

      try {
        console.log('Initializing YouTube player...');
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          height: '100%',
          width: '100%',
          playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'playsinline': 1,
            'origin': window.location.origin
          },
          events: {
            'onReady': () => {
              console.log('YouTube player ready');
              syncPlayer(stateRef.current);
              // Set initial volume
              if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(volume);
              }
            },
            'onStateChange': (event: any) => {
              console.log('Player state changed:', event.data);
              // Auto-next when video ends (state === 0)
              if (event.data === 0 && isHost) {
                handleNext();
              }
            },
            'onError': (e: any) => {
              console.error("YouTube Player Error:", e);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      console.log('YouTube API not ready yet, waiting...');
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          initPlayer();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [roomId, volume, isHost, handleNext]);

  // Sync Logic: Make the actual IFrame match the State
  const syncPlayer = (targetState: PlaybackState) => {
    if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') return;

    const player = playerRef.current;

    // Check if track changed
    const currentUrl = player.getVideoUrl ? player.getVideoUrl() : '';
    const targetId = targetState.currentTrack?.id;

    if (targetId) {
      if (!currentUrl || !currentUrl.includes(targetId)) {
        player.loadVideoById({
          videoId: targetId,
          startSeconds: targetState.isPlaying ? (Date.now() - targetState.startedAt) / 1000 : targetState.pausedAt
        });
      }
    }

    // Sync Playback Status
    const playerState = player.getPlayerState ? player.getPlayerState() : -1;

    if (targetState.isPlaying) {
      const now = Date.now();
      const seekTo = (now - targetState.startedAt) / 1000;

      const currentParams = player.getCurrentTime ? player.getCurrentTime() : 0;
      if (Math.abs(currentParams - seekTo) > 2) {
        player.seekTo(seekTo, true);
      }

      if (playerState !== 1) {
        player.playVideo();
      }
    } else {
      if (playerState !== 2 && playerState !== 5) {
        player.pauseVideo();
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchYoutubeVideos(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = async (track: MusicTrack) => {
    if (!roomId) return;

    try {
      const newTrack = { ...track, addedBy: user?.name || 'Unknown' };

      if (!state.currentTrack) {
        await updateMusicState(roomId, {
          audio: {
            currentTrack: newTrack,
            isPlaying: true,
            startedAt: Date.now(),
            queue: state.queue
          }
        });
      } else {
        const newQueue = [...state.queue, newTrack];
        await updateMusicState(roomId, { audio: { queue: newQueue } });
      }

      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const removeFromQueue = async (index: number) => {
    if (!roomId || !isHost) return;

    try {
      const newQueue = [...state.queue];
      newQueue.splice(index, 1);
      await updateMusicState(roomId, { audio: { queue: newQueue } });
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(newVolume);
    }
  };

  // Drag and drop handlers for reordering queue
  const handleDragStart = (index: number) => {
    if (!isHost) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex || !isHost || !roomId) return;

    try {
      const newQueue = [...state.queue];
      const [draggedTrack] = newQueue.splice(draggedIndex, 1);
      newQueue.splice(dropIndex, 0, draggedTrack);

      await updateMusicState(roomId, { audio: { queue: newQueue } });
      setDraggedIndex(null);
    } catch (error) {
      console.error('Error reordering queue:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Music Player Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">🎵 Music {isHost && '(Host)'}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Now Playing */}
      <div className="p-4 border-b space-y-3">
        {state.currentTrack ? (
          <>
            {/* YouTube Embed */}
            <div className="aspect-video rounded-lg overflow-hidden bg-black/20">
              <div ref={playerContainerRef} className="w-full h-full" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-semibold line-clamp-2">
                {state.currentTrack.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Added by {state.currentTrack.addedBy}
              </p>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrev}
                disabled={!isHost}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                disabled={!isHost}
              >
                {state.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                disabled={!isHost}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-muted-foreground w-8">{volume}%</span>
            </div>


          </>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-8">
            No track selected. Search and add a song!
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
          <Button type="submit" size="icon" disabled={isSearching}>
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Search Results or Queue */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {searchResults.length > 0 ? (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                SEARCH RESULTS
              </h3>
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  onClick={() => addToQueue(track)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer flex gap-3 items-start group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded flex-shrink-0 bg-black/20 overflow-hidden">
                    <img
                      src={track.thumbnail || `https://img.youtube.com/vi/${track.id}/default.jpg`}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{track.title}</p>
                    <p className="text-xs text-muted-foreground">+ Add to queue</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                QUEUE ({state.queue.length})
              </h3>
              {state.queue.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  Queue is empty. Search and add songs!
                </div>
              ) : (
                state.queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    draggable={isHost}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`p-2 rounded-lg transition-colors text-sm flex gap-3 items-start group ${draggedIndex === index ? 'opacity-50 bg-secondary' : 'hover:bg-secondary'
                      } ${isHost ? 'cursor-move' : ''}`}
                  >
                    {/* Drag Handle */}
                    {isHost && (
                      <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded flex-shrink-0 bg-black/20 overflow-hidden">
                      <img
                        src={track.thumbnail || `https://img.youtube.com/vi/${track.id}/default.jpg`}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">
                        {index + 1}. {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground">by {track.addedBy}</p>
                    </div>

                    {/* Delete Button */}
                    {isHost && (
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 transition-opacity flex-shrink-0"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
