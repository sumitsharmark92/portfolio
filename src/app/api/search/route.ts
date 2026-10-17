import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface SearchVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSec: number;
  author: string;
}

interface RawVideoRenderer {
  videoId?: string;
  title?: {
    runs?: Array<{ text?: string }>;
  };
  thumbnail?: {
    thumbnails?: Array<{ url?: string }>;
  };
  lengthText?: {
    simpleText?: string;
  };
  ownerText?: {
    runs?: Array<{ text?: string }>;
  };
}

interface RawItemSectionContent {
  videoRenderer?: RawVideoRenderer;
}

interface RawItemSection {
  itemSectionRenderer?: {
    contents?: RawItemSectionContent[];
  };
}

interface RawInitialData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: RawItemSection[];
        };
      };
    };
  };
}

function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || !q.trim()) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const query = q.trim();

    // Check if input is a direct YouTube URL or 11-char ID
    const urlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const directId = urlMatch ? urlMatch[1] : /^[a-zA-Z0-9_-]{11}$/.test(query) ? query : null;

    if (directId) {
      return NextResponse.json({
        success: true,
        results: [
          {
            id: directId,
            videoId: directId,
            title: `YouTube Video (${directId})`,
            thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
            duration: "YouTube Media",
            durationSec: 180,
            author: "YouTube",
          },
        ],
      });
    }

    // Direct YouTube Scraping without API key
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytRes = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await ytRes.text();
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

    if (!match) {
      return NextResponse.json({ success: true, results: [] });
    }

    let parsedData: RawInitialData;
    try {
      parsedData = JSON.parse(match[1]) as RawInitialData;
    } catch {
      return NextResponse.json({ success: true, results: [] });
    }

    const contents =
      parsedData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const results: SearchVideo[] = [];

    for (const section of contents) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (v?.videoId && v.title?.runs?.[0]?.text) {
          const duration = v.lengthText?.simpleText || "3:00";
          results.push({
            id: v.videoId,
            videoId: v.videoId,
            title: v.title.runs[0].text,
            thumbnail:
              v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            duration,
            durationSec: parseDurationToSeconds(duration),
            author: v.ownerText?.runs?.[0]?.text || "YouTube Creator",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: results.slice(0, 15),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failure";
    console.error("YouTube search error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
