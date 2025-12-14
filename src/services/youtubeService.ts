import type { MusicTrack } from '@/utils/types';
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export const searchYoutubeVideos = async (query: string): Promise<MusicTrack[]> => {
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
            addedBy: 'Search', // You might want to pass the username here if available context
            // We could add thumbnail or duration if we update the MusicTrack interface
        }));
    } catch (error) {
        console.error("Error searching YouTube:", error);
        return [];
    }
};
