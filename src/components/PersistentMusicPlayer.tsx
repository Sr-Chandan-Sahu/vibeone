import { MusicPlayer } from "@/components/MusicPlayer";
import type { User } from "@/utils/types";

interface PersistentMusicPlayerProps {
  roomId: string;
  user: User;
  isVisible?: boolean;
}

export function PersistentMusicPlayer({ roomId, user, isVisible = false }: PersistentMusicPlayerProps) {
  // Always render MusicPlayer - show or hide based on isVisible prop
  return (
    <div className={isVisible ? "" : "hidden"}>
      <MusicPlayer roomId={roomId} user={user} />
    </div>
  );
}
