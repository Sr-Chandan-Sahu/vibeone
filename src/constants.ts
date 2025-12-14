export const APP_NAME = "VIBEONE";

export const GEMINI_BOT_USER = {
  id: 'gemini-bot-id',
  name: 'Gemini AI',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gemini'
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
