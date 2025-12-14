import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchYoutubeVideos } from '@/services/youtubeService';
import type { MusicTrack } from '@/utils/types';

interface MusicPlayerProps {
  roomId?: string;
  onClose?: () => void;
}

export function MusicPlayer({ onClose }: MusicPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);

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

  const addToQueue = (track: MusicTrack) => {
    setQueue([...queue, track]);
    if (!currentTrack) {
      setCurrentTrack(track);
    }
  };

  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipNext = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex < queue.length - 1) {
        setCurrentTrack(queue[currentIndex + 1]);
      }
    }
  };

  const skipPrev = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex > 0) {
        setCurrentTrack(queue[currentIndex - 1]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Music Player Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Music</h2>
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
        {currentTrack ? (
          <>
            <div className="text-center">
              <h3 className="text-sm font-semibold line-clamp-2">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {currentTrack.addedBy}
              </p>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button size="icon" variant="ghost" onClick={skipPrev}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={togglePlayPause}>
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button size="icon" variant="ghost" onClick={skipNext}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>

            {/* YouTube Embed */}
            <div className="aspect-video rounded-lg overflow-hidden bg-black/20">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=${isPlaying ? 1 : 0}`}
                title={currentTrack.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                SEARCH RESULTS
              </h3>
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => addToQueue(track)}
                  className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors text-sm line-clamp-1"
                >
                  + {track.title}
                </button>
              ))}
            </>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                QUEUE
              </h3>
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">
                  Queue is empty
                </div>
              ) : (
                queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className={`p-2 rounded-lg cursor-pointer transition-colors text-sm line-clamp-1 ${
                      track.id === currentTrack?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => playTrack(track)}
                  >
                    {index + 1}. {track.title}
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
