import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { MusicState } from '@/utils/types';

interface MusicContextType {
  globalMusicState: MusicState;
  updateGlobalMusicState: (newState: Partial<MusicState>) => void;
  isLoggedOut: boolean;
  logout: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [globalMusicState, setGlobalMusicState] = useState<MusicState>({
    currentTrack: null,
    isPlaying: false,
    queue: [],
    startedAt: 0,
    pausedAt: 0
  });

  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const updateGlobalMusicState = useCallback((newState: Partial<MusicState>) => {
    setGlobalMusicState(prev => ({
      ...prev,
      ...newState
    }));
  }, []);

  const logout = useCallback(() => {
    setIsLoggedOut(true);
    setGlobalMusicState({
      currentTrack: null,
      isPlaying: false,
      queue: [],
      startedAt: 0,
      pausedAt: 0
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
