/**
 * Fixed exposure weight per category (0-100) used by the legacy category heat map
 * (src/components/CategoryHeatMap): a judgement per sector, not a measurement of the target.
 */
export const CATEGORY_THREAT_WEIGHTS: Record<string, number> = {
  security: 95,   // PGP keys, HackerOne, CTF, BugCrowd
  crypto: 90,     // Wallets, BitcoinTalk, Ethereum addresses
  developer: 85,  // GitHub, GitLab, Docker, npm tokens
  email: 80,      // MX records, Gravatar, direct email exposure
  finance: 80,    // CashApp, PayPal, Venmo
  social: 65,     // Twitter/X, Reddit, Telegram
  media: 50,      // YouTube, Twitch, Spotify
  community: 45,  // Discard, forums, StackExchange
  creative: 40,   // Behance, ArtStation, SoundCloud
  gaming: 35,     // Steam, Chess.com, Roblox
  default: 30,
};
