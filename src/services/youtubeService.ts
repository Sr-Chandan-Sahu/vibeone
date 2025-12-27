import type { MusicTrack } from '@/utils/types';
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export const searchYoutubeVideos = async (query: string, type: 'audio' | 'video' = 'video'): Promise<MusicTrack[]> => {
    if (!apiKey) {
        console.error("YouTube API Key is missing");
        return [];
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("YouTube API Error:", errorData);
            return [];
        }

        const data = await response.json();

        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            addedBy: 'Search',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            type: type
        }));
    } catch (error) {
        console.error("Error searching YouTube:", error);
        return [];
    }
};
