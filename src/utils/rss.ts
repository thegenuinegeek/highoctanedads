import { XMLParser } from 'fast-xml-parser';
import { SITE_CONFIG } from '../config';

export interface Episode {
  id: string;
  title: string;
  cleanTitle: string;
  episodeNumber: string;
  description: string;
  plainExcerpt: string;
  pubDate: string;
  formattedDate: string;
  duration: string;
  audioUrl: string;
  link: string;
  image: string;
  chapters: { time: string; label: string }[];
}

const FALLBACK_EPISODES: Episode[] = [
  {
    id: 'ep-40',
    title: 'High Octane Dads - Episode 40 - Music & Mini Trucks',
    cleanTitle: 'Music & Mini Trucks',
    episodeNumber: 'EP 40',
    description:
      'In this episode, James and Chris dive into their recent automotive maintenance adventures, discussing everything from fuel pump replacements to tire changes, family involvement in car projects, and the nostalgia of music and mini trucks.',
    plainExcerpt:
      'James and Chris dive into recent automotive maintenance adventures—from fuel pump replacements to tire changes—plus how music nostalgia and mini-truck culture intertwine with their automotive passions.',
    pubDate: 'Tue, 09 Sep 2025 12:15:00 GMT',
    formattedDate: 'SEP 9, 2025',
    duration: '01:05:42',
    audioUrl:
      'https://anchor.fm/s/f221d764/podcast/play/108043535/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-8-9%2F407155766-44100-2-3d8c6f468a6fa.mp3',
    link: 'https://podcasters.spotify.com/pod/show/highoctanedads/episodes/High-Octane-Dads---Episode-40---Music--Mini-Trucks-e37vnqf',
    image: '/images/HOD-Logo-2024.png',
    chapters: [
      { time: '00:00', label: 'Introduction and Maintenance Updates' },
      { time: '02:55', label: 'Fuel Pump Adventures' },
      { time: '08:41', label: 'Tire Changes and Upgrades' },
      { time: '25:52', label: 'The Evolution of Music Consumption' },
      { time: '56:43', label: 'Teasing Future Conversations on Mini Trucks' },
    ],
  },
  {
    id: 'ep-39',
    title: 'High Octane Dads - Episode 39 - Ultimate Dad Hobbies - Mid Life Crisis?',
    cleanTitle: 'Ultimate Dad Hobbies - Mid Life Crisis?',
    episodeNumber: 'EP 39',
    description:
      'What fuels a High Octane Dad? We cover the full spectrum from the garage to the music room—debating if the Ford Maverick is the perfect dad truck, classic midlife crisis cars, Nopi Nationals, and re-learning guitar as busy dads.',
    plainExcerpt:
      'From debating if the Ford Maverick is the ultimate dad truck and exploring the "midlife crisis car" phenomenon to autocross racing and re-learning guitar as busy dads.',
    pubDate: 'Sun, 03 Aug 2025 00:45:00 GMT',
    formattedDate: 'AUG 3, 2025',
    duration: '01:08:55',
    audioUrl:
      'https://anchor.fm/s/f221d764/podcast/play/106360571/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-7-3%2F405014244-44100-2-1e609383a7e32.mp3',
    link: 'https://podcasters.spotify.com/pod/show/highoctanedads/episodes/High-Octane-Dads---Episode-39---Ultimate-Dad-Hobbies---Mid-Life-Crisis-e36cc9r',
    image: '/images/HOD-Logo-2024.png',
    chapters: [
      { time: '00:00', label: 'Introduction: Cars & Guitars' },
      { time: '05:38', label: 'The Midlife Crisis Car Phenomenon' },
      { time: '22:08', label: 'Our Autocross Racing Experiences' },
    ],
  },
];

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function extractEpisodeNumber(rawTitle: string, itunesEp?: string | number): { epBadge: string; cleanTitle: string } {
  const epMatch = rawTitle.match(/Episode\s*(\d+)/i) || rawTitle.match(/Ep\.?\s*(\d+)/i) || rawTitle.match(/#(\d+)/);
  const epNum = epMatch ? epMatch[1] : itunesEp ? String(itunesEp) : '';
  const epBadge = epNum ? `EP ${epNum.padStart(2, '0')}` : 'BONUS';

  let clean = rawTitle
    .replace(/^High Octane Dads\s*(Podcast)?\s*[-–—:|]?\s*/i, '')
    .replace(/[-–—:|]?\s*High Octane Dads\s*(Podcast)?\s*[-–—:|]?\s*/i, ' ')
    .replace(/^Episode\s*\d+\s*[-–—:|]?\s*/i, '')
    .replace(/[-–—:|]?\s*Episode\s*\d+$/i, '')
    .trim();

  if (!clean) clean = rawTitle;
  return { epBadge, cleanTitle: clean };
}

function extractChapters(rawText: string): { time: string; label: string }[] {
  const plain = decodeEntities(rawText.replace(/<[^>]*>/g, '\n'));
  const regex = /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*([A-Za-z0-9][^\n\r\d]{3,65}?)(?=\s*\d{1,2}:\d{2}|#|$)/g;
  const chapters: { time: string; label: string }[] = [];
  let match;
  while ((match = regex.exec(plain)) !== null && chapters.length < 6) {
    chapters.push({
      time: match[1].trim(),
      label: match[2].replace(/\*\*.*$/, '').trim(),
    });
  }
  return chapters;
}

export async function getPodcastEpisodes(): Promise<Episode[]> {
  try {
    const response = await fetch(SITE_CONFIG.links.rss, {
      headers: { 'User-Agent': 'HighOctaneDads-StaticSite/1.0' },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch returned status ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const parsed = parser.parse(xmlText);
    const channel = parsed?.rss?.channel;
    if (!channel || !channel.item) {
      return FALLBACK_EPISODES;
    }

    const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];

    return rawItems.map((item: any, idx: number): Episode => {
      const rawTitle = String(item.title || `Episode ${rawItems.length - idx}`);
      const { epBadge, cleanTitle } = extractEpisodeNumber(rawTitle, item['itunes:episode']);
      const rawDesc = String(item.description || item['itunes:summary'] || '');
      const plain = stripHtml(rawDesc)
        .replace(/^Summary\s*/i, '')
        .replace(/Sound Bites.*$/i, '')
        .replace(/Chapters.*$/i, '')
        .replace(/TIME STAMPS.*$/i, '')
        .replace(/Podcast Timestamps.*$/i, '')
        .trim();

      const plainExcerpt = plain.length > 210 ? plain.slice(0, 207).trim() + '...' : plain;

      const pubDate = String(item.pubDate || '');
      let formattedDate = pubDate;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).toUpperCase();
        }
      }

      const enclosureUrl = item.enclosure?.['@_url'] || '';
      const imageHref =
        item['itunes:image']?.['@_href'] ||
        channel['itunes:image']?.['@_href'] ||
        '/images/HOD-Logo-2024.png';

      return {
        id: String(item.guid?.['#text'] || item.guid || `ep-${idx}`),
        title: rawTitle,
        cleanTitle,
        episodeNumber: epBadge,
        description: plain,
        plainExcerpt,
        pubDate,
        formattedDate,
        duration: String(item['itunes:duration'] || '01:00:00'),
        audioUrl: String(enclosureUrl),
        link: String(item.link || SITE_CONFIG.links.spotify),
        image: String(imageHref),
        chapters: extractChapters(rawDesc),
      };
    });
  } catch (err) {
    console.warn('Using fallback episodes because RSS fetch failed:', err);
    return FALLBACK_EPISODES;
  }
}
