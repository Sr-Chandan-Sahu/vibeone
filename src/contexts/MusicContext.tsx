import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MusicState } from '@/utils/types';

const defaultPlaybackState = {
  currentTrack: null,
  isPlaying: false,
  queue: [],
  startedAt: 0,
  pausedAt: 0
};

interface MusicContextType {
  globalMusicState: MusicState;
  updateGlobalMusicState: (newState: Partial<MusicState>) => void;
  isLoggedOut: boolean;
  logout: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [globalMusicState, setGlobalMusicState] = useState<MusicState>({
    audio: defaultPlaybackState,
    video: defaultPlaybackState,
    lastUpdated: Date.now()
  });

  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const updateGlobalMusicState = useCallback((newState: Partial<MusicState>) => {
    setGlobalMusicState(prev => ({
      ...prev,
      ...newState,
      lastUpdated: Date.now()
    }));
  }, []);

  const logout = useCallback(() => {
    setIsLoggedOut(true);
    setGlobalMusicState({
      audio: defaultPlaybackState,
      video: defaultPlaybackState,
      lastUpdated: Date.now()
    });
  }, []);

  return (
    <MusicContext.Provider
      value={{
        globalMusicState,
        updateGlobalMusicState,
        isLoggedOut,
        logout
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicContext must be used within MusicProvider');
  }
  return context;
}
