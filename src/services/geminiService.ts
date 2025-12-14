import { GoogleGenAI } from "@google/genai";
import type { Message, MusicTrack } from '../../types';

// Initialize the Gemini Client
// We safely access process.env.API_KEY to prevent ReferenceErrors in pure browser environments
// where 'process' might not be defined.

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';
const SEARCH_MODEL_NAME = 'gemini-2.5-flash'; 

export const generateAiResponseStream = async (
  history: Message[],
  newMessage: string,
  onChunk: (text: string) => void
) => {
  try {
    if (!apiKey) {
      onChunk("Error: API Key is missing.");
      return "Error: API Key is missing.";
    }

    // 1. Prepare history for the chat
    // We filter out system messages and map to the format Gemini expects (User/Model)
    const chatHistory = history
      .filter(m => m.type !== 'system' && !m.isStreaming)
      .slice(-10) // Keep context small
      .map(m => ({
        role: m.sender.id === 'gemini-bot-id' ? 'model' : 'user',
        parts: [{ text: `${m.sender.name}: ${m.text}` }],
      }));

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: chatHistory,
      config: {
        systemInstruction: "You are a helpful, witty, and concise AI assistant in a group chat room. Your name is Gemini. Keep responses relatively short and conversational.",
      },
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    let fullText = "";
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. 😵‍💫";
  }
};

// Search YouTube using Gemini's Google Search capabilities
export const searchYoutubeVideos = async (query: string): Promise<MusicTrack[]> => {
  try {
    if (!apiKey) return [];

    const response = await ai.models.generateContent({
      model: SEARCH_MODEL_NAME,
      contents: `Search youtube for "${query}". Return a list of 5 best matching videos. For each video, I need the Title and the YouTube URL. Format the output purely as a list of "Title | URL" lines.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n');
    const tracks: MusicTrack[] = [];
    
    // Simple parsing logic to extract video ID and title from organic search results
    for (const line of lines) {
      // Regex to find youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
      const urlMatch = line.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))/);
      
      if (urlMatch) {
        const url = urlMatch[1];
        const videoId = urlMatch[2];
        
        let title = line.replace(url, '').replace(/[|\-*:\[\]]/g, '').trim();
        if (title.length < 3) title = `Video ${videoId}`;

        if (!tracks.find(t => t.id === videoId)) {
          tracks.push({
            id: videoId,
            title: title,
            addedBy: 'Search'
          });
        }
      }
    }
    
    return tracks;
  } catch (error) {
    console.error("YouTube Search Error:", error);
    return [];
  }
};