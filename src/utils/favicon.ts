/**
 * Favicon resolution and domain extraction utilities for visual reconnaissance.
 */

const KNOWN_PLATFORM_DOMAINS: Record<string, string> = {
  github: 'github.com',
  gitlab: 'gitlab.com',
  dockerhub: 'docker.com',
  npm: 'npmjs.com',
  pypi: 'pypi.org',
  bitbucket: 'bitbucket.org',
  stackoverflow: 'stackoverflow.com',
  hackernews: 'news.ycombinator.com',
  devto: 'dev.to',
  codepen: 'codepen.io',
  replit: 'replit.com',
  kaggle: 'kaggle.com',
  huggingface: 'huggingface.co',
  twitter: 'x.com',
  x: 'x.com',
  reddit: 'reddit.com',
  instagram: 'instagram.com',
  tiktok: 'tiktok.com',
  youtube: 'youtube.com',
  twitch: 'twitch.tv',
  linkedin: 'linkedin.com',
  facebook: 'facebook.com',
  pinterest: 'pinterest.com',
  snapchat: 'snapchat.com',
  telegram: 'telegram.org',
  discord: 'discord.com',
  medium: 'medium.com',
  substack: 'substack.com',
  threads: 'threads.net',
  mastodon: 'mastodon.social',
  bluesky: 'bsky.app',
  steam: 'steampowered.com',
  roblox: 'roblox.com',
  chess: 'chess.com',
  lichess: 'lichess.org',
  binance: 'binance.com',
  coinbase: 'coinbase.com',
  opensea: 'opensea.io',
  etherscan: 'etherscan.io',
  hackthebox: 'hackthebox.com',
  tryhackme: 'tryhackme.com',
  bugcrowd: 'bugcrowd.com',
  hackerone: 'hackerone.com',
  spotify: 'spotify.com',
  soundcloud: 'soundcloud.com',
  vimeo: 'vimeo.com',
  flickr: 'flickr.com',
  behance: 'behance.net',
  dribbble: 'dribbble.com',
  artstation: 'artstation.com',
  patreon: 'patreon.com',
  buy_me_a_coffee: 'buymeacoffee.com',
};

/**
 * Extract clean root domain/hostname from a platform URL pattern or live URL
 */
export function getDomainFromPlatform(url: string, platformId?: string): string {
  if (platformId && KNOWN_PLATFORM_DOMAINS[platformId.toLowerCase()]) {
    return KNOWN_PLATFORM_DOMAINS[platformId.toLowerCase()];
  }

  if (!url) return '';

  try {
    // Replace template parameters like {username} with a dummy string
    const cleanUrl = url.replace(/\{username\}|\{.*?\}/g, 'probe');
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    return host;
  } catch {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Primary Google Favicon Service URL
 */
export function getGoogleFaviconUrl(domain: string, size = 32): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * Secondary DuckDuckGo Favicon Service URL
 */
export function getDuckDuckGoFaviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

/**
 * Generate a 1-2 character monogram code for platforms when favicons fail to load
 */
export function getPlatformMonogram(platformName: string): string {
  if (!platformName) return 'OS';
  const parts = platformName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return platformName.substring(0, 2).toUpperCase();
}
