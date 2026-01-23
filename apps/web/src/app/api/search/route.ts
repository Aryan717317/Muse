import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

interface YouTubeSearchItem {
    id: { videoId: string };
    snippet: {
        title: string;
        channelTitle: string;
        thumbnails: {
            medium: { url: string };
            high: { url: string };
        };
    };
}

interface YouTubeVideoItem {
    id: string;
    contentDetails: {
        duration: string; // ISO 8601 format e.g. "PT4M13S"
    };
}

function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Return error if no API key is configured
    if (!YOUTUBE_API_KEY) {
        console.error('[Search API] Missing YOUTUBE_API_KEY env var');
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    try {
        // Step 1: Search for videos
        const searchResponse = await fetch(
            `${YOUTUBE_API_URL}?` +
            new URLSearchParams({
                part: 'snippet',
                q: query,
                type: 'video',
                videoCategoryId: '10', // Music category
                maxResults: '10',
                key: YOUTUBE_API_KEY,
            })
        );

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('[Search API] YouTube API Error:', {
                status: searchResponse.status,
                statusText: searchResponse.statusText,
                body: errorText
            });
            throw new Error(`YouTube API returned ${searchResponse.status}: ${errorText}`);
        }

        const searchData = await searchResponse.json();
        const items: YouTubeSearchItem[] = searchData.items || [];

        if (items.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Step 2: Get video durations
        const videoIds = items.map((item) => item.id.videoId).join(',');
        const videosResponse = await fetch(
            `${YOUTUBE_VIDEOS_URL}?` +
            new URLSearchParams({
                part: 'contentDetails',
                id: videoIds,
                key: YOUTUBE_API_KEY,
            })
        );

        const videosData = await videosResponse.json();
        const videoDetails: YouTubeVideoItem[] = videosData.items || [];

        // Create a map of video durations
        const durationMap = new Map<string, number>();
        videoDetails.forEach((video) => {
            durationMap.set(video.id, parseDuration(video.contentDetails.duration));
        });

        // Step 3: Combine results
        const results = items.map((item) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.high?.url,
            duration: durationMap.get(item.id.videoId) || 0,
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('[Search API] Error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });

        return NextResponse.json(
            {
                error: 'Failed to search YouTube',
                details: error.message
            },
            { status: 500 }
        );
    }
}
