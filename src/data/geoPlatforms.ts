export interface PlatformGeoData {
  platformId: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  city: string;
  country: string;
  countryCode: string;
  region: 'North America' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Latin America' | 'Oceania' | 'Global / Distributed';
  jurisdiction: 'Five Eyes' | 'EU / GDPR' | 'Swiss Sanctuary' | 'Eastern European / CIS' | 'APAC' | 'Offshore / Neutral';
  threatScore: number; // 1 - 100 legal & forensic exposure index
  cloudProvider: string;
  subpoenaExposure: 'High (MLAT)' | 'Moderate (GDPR Intercept)' | 'Low (Sanctuary)' | 'Guarded (Offshore)' | 'Strict';
  physicalRisk: 'high' | 'medium' | 'low';
  threatNotes: string;
  serverIp?: string;
  asn?: string;
  isp?: string;
  resolvedHost?: string;
}

export interface MappedOrigin {
  id: string;
  platformId: string;
  platformName: string;
  category: string;
  url: string;
  coordinates: [number, number]; // [longitude, latitude]
  city: string;
  country: string;
  countryCode: string;
  region: string;
  jurisdiction: 'Five Eyes' | 'EU / GDPR' | 'Swiss Sanctuary' | 'Eastern European / CIS' | 'APAC' | 'Offshore / Neutral';
  threatScore: number;
  cloudProvider: string;
  subpoenaExposure: string;
  physicalRisk: 'high' | 'medium' | 'low';
  threatNotes: string;
  status: string;
  confidenceScore?: number;
  serverIp: string;
  asn: string;
  isp: string;
  resolvedHost: string;
  threatDensityWeight: number; // calculated threat footprint density metric
}

export interface ThreatDensityCluster {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: [number, number];
  origins: MappedOrigin[];
  totalDensityScore: number;
  avgThreatScore: number;
  densityTier: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  radiusKm: number;
  dominantAsn: string;
  subpoenaRiskProfile: string;
}

// Comprehensive registry of platform headquarters, hosting infrastructure & jurisdiction origins
export const PLATFORM_GEO_REGISTRY: Record<string, Omit<PlatformGeoData, 'platformId' | 'name'>> = {
  // Developer Platforms
  github: {
    coordinates: [-122.395, 37.782],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 88,
    cloudProvider: 'Microsoft Azure / Fastly',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Five Eyes 18 U.S.C. § 2703(d) subpoena compliance; Git commit logs disclose local timezone and git author email.'
  },
  gitlab: {
    coordinates: [-122.419, 37.774],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 82,
    cloudProvider: 'Google Cloud Platform',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Remote-first US incorporated entity. CI/CD runners can expose IP egress and developer workstations.'
  },
  dockerhub: {
    coordinates: [-121.886, 37.338],
    city: 'San Jose, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 78,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'OCI image layers frequently embed target architecture, filesystem paths, and build environment variables.'
  },
  npm: {
    coordinates: [-122.271, 37.804],
    city: 'Oakland, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 80,
    cloudProvider: 'GitHub / Fastly CDN',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Package metadata exposes maintainer emails, PGP key signatures, and package publishing timestamps.'
  },
  pypi: {
    coordinates: [-122.803, 45.487],
    city: 'Beaverton, OR',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 75,
    cloudProvider: 'Python Software Foundation / Fastly',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Public wheel artifacts preserve developer setup.py metadata and system user paths.'
  },
  codepen: {
    coordinates: [-121.315, 44.058],
    city: 'Bend, OR',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 60,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Front-end asset links can expose external API endpoints and private CDN buckets.'
  },
  replit: {
    coordinates: [-122.401, 37.788],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 74,
    cloudProvider: 'Google Cloud Platform',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Active repl container instances can leak running daemon ports and public environment keys.'
  },
  devto: {
    coordinates: [-74.006, 40.712],
    city: 'New York, NY',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 65,
    cloudProvider: 'Fastly / Heroku',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Forem network federation; article publish times reveal sleep/work diurnal cycles.'
  },
  hackerrank: {
    coordinates: [-122.084, 37.422],
    city: 'Mountain View, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 70,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Assessment leaderboard profiles disclose skill competencies and candidate geographic locations.'
  },
  leetcode: {
    coordinates: [-122.143, 37.441],
    city: 'Palo Alto, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 72,
    cloudProvider: 'Cloudflare / AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Global ranking data maps target preparation timeframes and interview cycle targets.'
  },
  kaggle: {
    coordinates: [-122.419, 37.774],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 76,
    cloudProvider: 'Google Cloud Platform',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Jupyter notebook releases reveal hardware configurations, ML model weights, and research affiliations.'
  },
  hashnode: {
    coordinates: [-75.546, 39.744],
    city: 'Wilmington, DE',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 68,
    cloudProvider: 'Vercel / AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Custom domain mapping exposes target DNS provider, nameservers, and certificate transparency logs.'
  },

  // Social & Community Networks
  twitter: {
    coordinates: [-122.416, 37.776],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 92,
    cloudProvider: 'X Corp Datacenters',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'high',
    threatNotes: 'Geotagged tweets, client user-agents (e.g. iPhone vs Web), and mutual follower graphing.'
  },
  reddit: {
    coordinates: [-122.401, 37.788],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 85,
    cloudProvider: 'Fastly / Amazon AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Subreddit moderation logs and comment history trace local municipal affiliations (r/city).'
  },
  instagram: {
    coordinates: [-122.181, 37.453],
    city: 'Menlo Park, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 94,
    cloudProvider: 'Meta Infrastructure',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'high',
    threatNotes: 'Critical physical tracking risk. Photo EXIF metadata, background visual landmarks, and tagged locations.'
  },
  tiktok: {
    coordinates: [103.819, 1.352],
    city: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Asia-Pacific',
    jurisdiction: 'APAC',
    threatScore: 89,
    cloudProvider: 'ByteDance / Oracle Cloud',
    subpoenaExposure: 'Guarded (Offshore)',
    physicalRisk: 'high',
    threatNotes: 'Video audio fingerprints, biometric facial vectors, and local Wi-Fi SSID network harvesting.'
  },
  bluesky: {
    coordinates: [-122.332, 47.606],
    city: 'Seattle, WA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 78,
    cloudProvider: 'AT Protocol / Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Public authenticated data repository. Every post, like, and follow is signed cryptographically in the open firehose.'
  },
  mastodon: {
    coordinates: [11.589, 50.927],
    city: 'Jena',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 70,
    cloudProvider: 'Hetzner / OVHcloud',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Decentralized ActivityPub federation. Host server admin logs retain target IP connection records.'
  },
  threads: {
    coordinates: [-122.181, 37.453],
    city: 'Menlo Park, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 90,
    cloudProvider: 'Meta Infrastructure',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'high',
    threatNotes: 'Fediverse federation bridge; direct identity pairing with target Instagram social graph.'
  },
  pinterest: {
    coordinates: [-122.399, 37.775],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 68,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Board curation patterns identify personal interests, purchasing intents, and interior floor plans.'
  },
  telegram: {
    coordinates: [55.270, 25.204],
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    region: 'Middle East',
    jurisdiction: 'Offshore / Neutral',
    threatScore: 84,
    cloudProvider: 'Telegram Datacenters (NL, SG, US, AE)',
    subpoenaExposure: 'Guarded (Offshore)',
    physicalRisk: 'medium',
    threatNotes: 'Offshore corporate jurisdiction. Nearby users feature can expose geolocation coordinates within meters.'
  },
  linktree: {
    coordinates: [144.963, -37.813],
    city: 'Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    region: 'Oceania',
    jurisdiction: 'Five Eyes',
    threatScore: 86,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Key OSINT pivot. Concentrates all external profiles, payment links, and personal storefronts in one index.'
  },
  tumblr: {
    coordinates: [-74.006, 40.712],
    city: 'New York, NY',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 66,
    cloudProvider: 'Automattic Cloud',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Archive dating back to 2007; historic posts often preserve early-life identities and discontinued handles.'
  },
  medium: {
    coordinates: [-122.402, 37.789],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 72,
    cloudProvider: 'Cloudflare / AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Author bio, personal publications, and clapping patterns map target professional circle.'
  },

  // Gaming Platforms
  steam: {
    coordinates: [-122.201, 47.610],
    city: 'Bellevue, WA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 82,
    cloudProvider: 'Valve CDN / Akamai',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'SteamID64 enumeration, linked inventory values, match play history, and historic alias aliases.'
  },
  chess_com: {
    coordinates: [-111.891, 40.760],
    city: 'Salt Lake City, UT',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 68,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Public country flag selection, club memberships, and game timestamps map wakefulness patterns.'
  },
  lichess: {
    coordinates: [2.352, 48.856],
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 64,
    cloudProvider: 'OVHcloud',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Non-profit French organization. Open API exposes complete PGN games and historical rating timelines.'
  },
  twitch: {
    coordinates: [-122.398, 37.790],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 84,
    cloudProvider: 'Amazon Web Services IVS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Chat room logs, subscriber badges, stream VOD ambient audio, and connected discord links.'
  },
  roblox: {
    coordinates: [-122.325, 37.563],
    city: 'San Mateo, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 76,
    cloudProvider: 'Roblox Edge Cloud',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'User profile badges, group ownership, and transaction inventories identify social cliques.'
  },
  speedrun: {
    coordinates: [18.068, 59.329],
    city: 'Stockholm',
    country: 'Sweden',
    countryCode: 'SE',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 62,
    cloudProvider: 'Network N Cloud',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Video proof links (YouTube/Twitch) and connected social profiles documented on runner page.'
  },
  namemc: {
    coordinates: [14.437, 50.075],
    city: 'Prague',
    country: 'Czech Republic',
    countryCode: 'CZ',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 70,
    cloudProvider: 'Cloudflare Edge',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Minecraft UUID history tracks name change sequences across multi-year intervals.'
  },

  // Security & Hacking
  keybase: {
    coordinates: [-122.405, 37.789],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 92,
    cloudProvider: 'Zoom Video Communications',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Critical identity nexus. Cryptographically proves ownership of Twitter, GitHub, domain, and Bitcoin keys.'
  },
  hackthebox: {
    coordinates: [1.174, 51.080],
    city: 'Folkestone',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    jurisdiction: 'Five Eyes',
    threatScore: 86,
    cloudProvider: 'Amazon Web Services UK',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Cyber warfare & penetration testing rank. Discloses technical capability tier and cert accreditations.'
  },
  tryhackme: {
    coordinates: [-0.127, 51.507],
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    jurisdiction: 'Five Eyes',
    threatScore: 84,
    cloudProvider: 'DigitalOcean / Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Badge completions map security offensive/defensive competencies and target university/employer affiliations.'
  },
  pastebin: {
    coordinates: [-118.243, 34.052],
    city: 'Los Angeles, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 88,
    cloudProvider: 'Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Target public pastes often contain code snippets, configuration files, or leaked credentials.'
  },
  bugcrowd: {
    coordinates: [-122.400, 37.780],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 82,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Public hall of fame ranks confirm bounty hunter identity and enterprise engagement history.'
  },
  hackerone: {
    coordinates: [-122.410, 37.785],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 85,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Vulnerability disclosures, public bounty thanks, and cybersecurity reputation metric.'
  },

  // Creative & Media
  behance: {
    coordinates: [-121.894, 37.331],
    city: 'San Jose, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 72,
    cloudProvider: 'Adobe Creative Cloud',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Commercial portfolio case studies often list client company names, employers, and design credits.'
  },
  dribbble: {
    coordinates: [-70.896, 42.519],
    city: 'Salem, MA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 68,
    cloudProvider: 'Fastly / Amazon AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Design projects reveal client identities, software stack competencies, and employment status.'
  },
  artstation: {
    coordinates: [-73.567, 45.501],
    city: 'Montreal',
    country: 'Canada',
    countryCode: 'CA',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 70,
    cloudProvider: 'Epic Games / AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Entertainment industry credits; exposes studios and games target has contributed to.'
  },
  soundcloud: {
    coordinates: [13.405, 52.520],
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 72,
    cloudProvider: 'Amazon Web Services Frankfurt',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Location field frequently contains city name. Associated tracks may feature voice samples.'
  },
  bandcamp: {
    coordinates: [-122.271, 37.804],
    city: 'Oakland, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 70,
    cloudProvider: 'Songtradr / Fastly',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Fan collection purchases reveal physical merch shipping destinations and PayPal email traces.'
  },
  spotify: {
    coordinates: [18.068, 59.329],
    city: 'Stockholm',
    country: 'Sweden',
    countryCode: 'SE',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 76,
    cloudProvider: 'Google Cloud Platform',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Public playlists, collaborative listening sessions, and artist followings map psycho-demographics.'
  },

  // Crypto & Finance
  opensea: {
    coordinates: [-74.006, 40.712],
    city: 'New York, NY',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 90,
    cloudProvider: 'Cloudflare / Alchemy',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Direct link to Ethereum public addresses (0x...). Enables complete on-chain balance and DEX transaction tracing.'
  },
  bitcointalk: {
    coordinates: [24.938, 60.169],
    city: 'Helsinki',
    country: 'Finland',
    countryCode: 'FI',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 86,
    cloudProvider: 'Linode / Akamai',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'Historical Bitcoin forum. Early posts often link PGP fingerprints, wallet addresses, and IRC nicks.'
  },

  // Lifestyle, Health & GPS Geolocation Threat Vectors
  strava: {
    coordinates: [-122.397, 37.785],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 98,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'high',
    threatNotes: 'CRITICAL PHYSICAL THREAT. GPS activity heatmaps and running routes pinpoint target home address and routine.'
  },
  duolingo: {
    coordinates: [-79.995, 40.440],
    city: 'Pittsburgh, PA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 74,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Language practice streaks disclose native language, target study languages, and school leagues.'
  },
  goodreads: {
    coordinates: [-122.332, 47.606],
    city: 'Seattle, WA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 65,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Bookshelf reviews and reading updates expose personal interests, reading pace, and political inclinations.'
  },
  patreon: {
    coordinates: [-122.401, 37.776],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 84,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'Subscriber patronage tiers and creator revenue metrics disclose commercial cashflow and patrons.'
  },
  buymeacoffee: {
    coordinates: [-122.419, 37.774],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 78,
    cloudProvider: 'Cloudflare / AWS',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Payment gateway integration connects Stripe and PayPal customer payment trails.'
  },
  producthunt: {
    coordinates: [-122.400, 37.780],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 72,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Maker badges, startup launches, and co-founder tags highlight corporate commercial ventures.'
  },
  hackernews: {
    coordinates: [-122.084, 37.422],
    city: 'Mountain View, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 76,
    cloudProvider: 'M5 Hosting / Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Karma score, "about" field markdown, and comment threads trace engineering opinions and startup investments.'
  },
  substack: {
    coordinates: [-122.419, 37.775],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 78,
    cloudProvider: 'Amazon Web Services',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Paid newsletter subscriptions, author masthead, and custom publication domains.'
  }
};

// Fallback regional hubs by category or country
export const REGIONAL_DEFAULTS: Record<string, Omit<PlatformGeoData, 'platformId' | 'name'>> = {
  developer: {
    coordinates: [-122.419, 37.774],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 80,
    cloudProvider: 'AWS / Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Silicon Valley developer ecosystem standard jurisdiction.'
  },
  security: {
    coordinates: [-0.127, 51.507],
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    jurisdiction: 'Five Eyes',
    threatScore: 85,
    cloudProvider: 'Five Eyes Cyber Node',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'European cybersecurity and CERT operations corridor.'
  },
  social: {
    coordinates: [-74.006, 40.712],
    city: 'New York, NY',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 82,
    cloudProvider: 'Edge CDN',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'medium',
    threatNotes: 'East Coast media and social nexus.'
  },
  gaming: {
    coordinates: [-122.201, 47.610],
    city: 'Seattle, WA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 75,
    cloudProvider: 'Gaming Edge Anycast',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Pacific Northwest interactive entertainment hub.'
  },
  crypto: {
    coordinates: [8.541, 47.376],
    city: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    region: 'Europe',
    jurisdiction: 'Swiss Sanctuary',
    threatScore: 86,
    cloudProvider: 'Swiss Crypto Valley Node',
    subpoenaExposure: 'Low (Sanctuary)',
    physicalRisk: 'low',
    threatNotes: 'Swiss Crypto Valley jurisdiction with high data protection privacy laws.'
  },
  creative: {
    coordinates: [-118.243, 34.052],
    city: 'Los Angeles, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 70,
    cloudProvider: 'Fastly / Akamai',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Southern California entertainment & media cluster.'
  },
  community: {
    coordinates: [-122.401, 37.788],
    city: 'San Francisco, CA',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    jurisdiction: 'Five Eyes',
    threatScore: 72,
    cloudProvider: 'Cloudflare',
    subpoenaExposure: 'High (MLAT)',
    physicalRisk: 'low',
    threatNotes: 'Global discussion and community forums.'
  },
  media: {
    coordinates: [13.405, 52.520],
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    jurisdiction: 'EU / GDPR',
    threatScore: 70,
    cloudProvider: 'EU Cloud',
    subpoenaExposure: 'Moderate (GDPR Intercept)',
    physicalRisk: 'low',
    threatNotes: 'European creative & audio streaming hub.'
  }
};

// Deterministic jitter helper so overlapping pins in San Francisco or London disperse slightly for optical clarity
function getJitter(seed: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const dx = ((Math.abs(hash) % 100) - 50) / 18; // ~ ±2.5 degrees max
  const dy = ((Math.abs(hash >> 3) % 100) - 50) / 22;
  return [dx, dy];
}

// Server Infrastructure & IP Resolution Registry
const SERVER_SPEC_REGISTRY: Record<string, { ip: string; asn: string; isp: string; host: string }> = {
  github: { ip: '140.82.121.4', asn: 'AS36459 GITHUB', isp: 'Fastly / Azure Anycast', host: 'lb-140-82-121-4-iad.github.com' },
  gitlab: { ip: '172.65.251.78', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'gitlab.com' },
  twitter: { ip: '104.244.42.1', asn: 'AS13414 TWITTER', isp: 'X Corp Edge Network', host: 'x.com' },
  reddit: { ip: '151.101.1.140', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'reddit.com' },
  instagram: { ip: '157.240.22.35', asn: 'AS32934 FACEBOOK', isp: 'Meta Infrastructure', host: 'edge-star-mini-shv-01-sjc3.facebook.com' },
  tiktok: { ip: '130.176.120.21', asn: 'AS138699 BYTEDANCE', isp: 'ByteDance Global CDN', host: 'tiktok.com' },
  bluesky: { ip: '104.21.80.201', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'bsky.app' },
  mastodon: { ip: '168.119.140.72', asn: 'AS24940 HETZNER', isp: 'Hetzner Online GmbH', host: 'mastodon.social' },
  threads: { ip: '157.240.22.174', asn: 'AS32934 FACEBOOK', isp: 'Meta Edge', host: 'threads.net' },
  steam: { ip: '162.254.197.36', asn: 'AS32590 VALVE-CORPORATION', isp: 'Valve Backbone', host: 'steamcommunity.com' },
  keybase: { ip: '54.230.12.87', asn: 'AS16509 AMAZON-02', isp: 'Amazon CloudFront / Zoom', host: 'keybase.io' },
  strava: { ip: '151.101.65.140', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast / AWS', host: 'strava.com' },
  spotify: { ip: '35.186.224.25', asn: 'AS15169 GOOGLE-CLOUD', isp: 'Google Cloud Anycast', host: 'spotify.com' },
  telegram: { ip: '149.154.167.99', asn: 'AS62041 TELEGRAM-MESSENGER', isp: 'Telegram Core Network', host: 't.me' },
  linkedin: { ip: '13.107.42.14', asn: 'AS8075 MICROSOFT', isp: 'Microsoft Azure Anycast', host: 'linkedin.com' },
  youtube: { ip: '142.250.190.46', asn: 'AS15169 GOOGLE', isp: 'Google Global Cache', host: 'youtube.com' },
  twitch: { ip: '151.101.66.167', asn: 'AS54113 FASTLY', isp: 'Fastly / Amazon IVS', host: 'twitch.tv' },
  discord: { ip: '162.159.135.232', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'discord.com' },
  dockerhub: { ip: '52.205.157.170', asn: 'AS14618 AMAZON-AES', isp: 'Amazon Web Services', host: 'hub.docker.com' },
  npm: { ip: '104.16.29.34', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge CDN', host: 'registry.npmjs.org' },
  pypi: { ip: '151.101.0.223', asn: 'AS54113 FASTLY', isp: 'Fastly CDN', host: 'pypi.org' },
  devto: { ip: '151.101.65.140', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'dev.to' },
  hackthebox: { ip: '104.18.2.147', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare UK Edge', host: 'hackthebox.com' },
  tryhackme: { ip: '104.26.10.231', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'tryhackme.com' },
  pastebin: { ip: '104.20.208.21', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'pastebin.com' },
  bugcrowd: { ip: '151.101.64.133', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'bugcrowd.com' },
  hackerone: { ip: '104.16.99.52', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'hackerone.com' },
  patreon: { ip: '151.101.1.140', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'patreon.com' },
  substack: { ip: '104.18.18.118', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'substack.com' },
  pinterest: { ip: '151.101.2.84', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'pinterest.com' },
  medium: { ip: '162.159.152.4', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'medium.com' },
  chess_com: { ip: '104.16.109.18', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Anycast', host: 'chess.com' },
  lichess: { ip: '185.130.44.10', asn: 'AS16276 OVH', isp: 'OVHcloud SAS', host: 'lichess.org' },
  roblox: { ip: '128.116.119.3', asn: 'AS22697 ROBLOX', isp: 'Roblox Edge Network', host: 'roblox.com' },
  behance: { ip: '151.101.129.140', asn: 'AS54113 FASTLY', isp: 'Adobe / Fastly Anycast', host: 'behance.net' },
  dribbble: { ip: '151.101.65.140', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast', host: 'dribbble.com' },
  soundcloud: { ip: '151.101.1.200', asn: 'AS54113 FASTLY', isp: 'Fastly Anycast Berlin', host: 'soundcloud.com' },
  opensea: { ip: '104.18.25.105', asn: 'AS13335 CLOUDFLARENET', isp: 'Cloudflare Edge', host: 'opensea.io' },
  duolingo: { ip: '99.86.38.104', asn: 'AS16509 AMAZON-02', isp: 'Amazon CloudFront', host: 'duolingo.com' }
};

/**
 * Resolves deterministic server IP, ASN, ISP, and host for any platform
 */
export function resolveServerSpecs(platformId: string): { ip: string; asn: string; isp: string; host: string } {
  const cleanId = platformId.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (SERVER_SPEC_REGISTRY[cleanId]) {
    return SERVER_SPEC_REGISTRY[cleanId];
  }

  // Deterministic fallback generator
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash << 5) - hash + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const octet3 = Math.abs(hash % 254) + 1;
  const octet4 = Math.abs((hash >> 8) % 254) + 1;
  const isCloudflare = (hash % 2) === 0;

  if (isCloudflare) {
    return {
      ip: `104.21.${octet3}.${octet4}`,
      asn: 'AS13335 CLOUDFLARENET',
      isp: 'Cloudflare Edge Anycast',
      host: `edge-ingress-${cleanId}.net`
    };
  } else {
    return {
      ip: `151.101.${octet3}.${octet4}`,
      asn: 'AS54113 FASTLY',
      isp: 'Fastly Anycast CDN',
      host: `cdn-node-${cleanId}.global.fastly.net`
    };
  }
}

/**
 * Resolves full geographical threat metadata for a platform
 */
export function resolvePlatformGeo(platformId: string, platformName: string, category: string): PlatformGeoData {
  const cleanId = platformId.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const entry = PLATFORM_GEO_REGISTRY[cleanId];
  const serverSpecs = resolveServerSpecs(cleanId);

  if (entry) {
    const [jLng, jLat] = getJitter(platformId);
    return {
      platformId,
      name: platformName,
      ...entry,
      coordinates: [entry.coordinates[0] + jLng * 0.4, entry.coordinates[1] + jLat * 0.4],
      serverIp: serverSpecs.ip,
      asn: serverSpecs.asn,
      isp: serverSpecs.isp,
      resolvedHost: serverSpecs.host
    };
  }

  // Fallback to category default
  const defaultEntry = REGIONAL_DEFAULTS[category] || REGIONAL_DEFAULTS.developer;
  const [jLng, jLat] = getJitter(platformId);
  return {
    platformId,
    name: platformName,
    ...defaultEntry,
    coordinates: [defaultEntry.coordinates[0] + jLng, defaultEntry.coordinates[1] + jLat],
    serverIp: serverSpecs.ip,
    asn: serverSpecs.asn,
    isp: serverSpecs.isp,
    resolvedHost: serverSpecs.host
  };
}

/**
 * Calculates threat density weight for an origin based on exposure and risk factors
 */
export function calculateThreatDensityWeight(threatScore: number, physicalRisk: 'high' | 'medium' | 'low', jurisdiction: string): number {
  let weight = threatScore;
  if (physicalRisk === 'high') weight += 24;
  else if (physicalRisk === 'medium') weight += 10;

  if (jurisdiction === 'Five Eyes') weight += 15;
  else if (jurisdiction === 'EU / GDPR') weight += 6;

  return Math.min(100, Math.max(15, weight));
}

/**
 * Predefined geographic datacenter / metropolitan clusters
 */
interface HubDefinition {
  id: string;
  name: string;
  region: string;
  country: string;
  coords: [number, number];
  subpoenaRiskProfile: string;
}

const PREDEFINED_HUBS: HubDefinition[] = [
  { id: 'bay-area', name: 'Silicon Valley & Bay Area Corridor', region: 'North America', country: 'United States', coords: [-122.3, 37.6], subpoenaRiskProfile: '18 U.S.C. § 2703(d) MLAT Sovereign Reach' },
  { id: 'pacific-nw', name: 'Pacific Northwest Cloud Hub', region: 'North America', country: 'United States', coords: [-122.2, 47.5], subpoenaRiskProfile: 'Five Eyes Cloud Subpoena Corridor' },
  { id: 'us-east-alley', name: 'Mid-Atlantic Datacenter Alley (Ashburn/DC)', region: 'North America', country: 'United States', coords: [-77.4, 39.0], subpoenaRiskProfile: 'High Density Federal Wiretap Corridor' },
  { id: 'us-northeast', name: 'Northeast Financial / Media Enclave', region: 'North America', country: 'United States', coords: [-74.0, 40.7], subpoenaRiskProfile: 'Five Eyes NY Financial Hub' },
  { id: 'uk-london', name: 'London Tech & Telemetry Corridor', region: 'Europe', country: 'United Kingdom', coords: [-0.12, 51.5], subpoenaRiskProfile: 'UK Investigatory Powers Act (IPA 2016)' },
  { id: 'de-central-eu', name: 'Central European Internet Exchange (DE-CIX)', region: 'Europe', country: 'Germany', coords: [8.68, 50.11], subpoenaRiskProfile: 'GDPR Intercept / BND Telecommunications Act' },
  { id: 'ch-sanctuary', name: 'Swiss Privacy Sanctuary (Geneva/Zurich)', region: 'Europe', country: 'Switzerland', coords: [7.5, 46.8], subpoenaRiskProfile: 'FADP Article 13 Privacy Protection Zone' },
  { id: 'nordic-hub', name: 'Nordic Low-Carbon Datacenter Node', region: 'Europe', country: 'Sweden', coords: [18.06, 59.33], subpoenaRiskProfile: 'EU GDPR Strong Sovereign Enforcement' },
  { id: 'apac-singapore', name: 'Southeast Asia Anycast Gateway', region: 'Asia-Pacific', country: 'Singapore', coords: [103.8, 1.35], subpoenaRiskProfile: 'APAC Cross-Border Intercept Node' },
  { id: 'oceania-hub', name: 'Oceania Five Eyes Anchor (Melbourne/Sydney)', region: 'Oceania', country: 'Australia', coords: [144.9, -37.8], subpoenaRiskProfile: 'TOLA Act Decryption Notice Corridor' },
  { id: 'me-dubai', name: 'Gulf Interconnection Hub', region: 'Middle East', country: 'United Arab Emirates', coords: [55.27, 25.20], subpoenaRiskProfile: 'Regional Regulatory Gateway' },
];

/**
 * Calculates geographical distance between two coordinate pairs in kilometers using Haversine formula
 */
function haversineDistance(c1: [number, number], c2: [number, number]): number {
  const R = 6371; // km
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const dLng = ((c2[0] - c1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[1] * Math.PI) / 180) *
      Math.cos((c2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Groups mapped origins into high-density threat footprint clusters
 */
export function computeDensityClusters(origins: MappedOrigin[]): ThreatDensityCluster[] {
  if (origins.length === 0) return [];

  const clusterBuckets: Record<string, { hub: HubDefinition; origins: MappedOrigin[] }> = {};
  const unassigned: MappedOrigin[] = [];

  // Match against known datacenter hubs (within 650km radius)
  origins.forEach((origin) => {
    let closestHub: HubDefinition | null = null;
    let minDistance = 650; // km threshold

    PREDEFINED_HUBS.forEach((hub) => {
      const dist = haversineDistance(origin.coordinates, hub.coords);
      if (dist < minDistance) {
        minDistance = dist;
        closestHub = hub;
      }
    });

    if (closestHub) {
      const h = closestHub as HubDefinition;
      if (!clusterBuckets[h.id]) {
        clusterBuckets[h.id] = { hub: h, origins: [] };
      }
      clusterBuckets[h.id].origins.push(origin);
    } else {
      unassigned.push(origin);
    }
  });

  const clusters: ThreatDensityCluster[] = [];

  // Assemble predefined hub clusters
  Object.values(clusterBuckets).forEach(({ hub, origins: clusterOrigins }) => {
    const totalDensityScore = clusterOrigins.reduce((acc, o) => acc + o.threatDensityWeight, 0);
    const avgThreatScore = Math.round(clusterOrigins.reduce((acc, o) => acc + o.threatScore, 0) / clusterOrigins.length);

    // Dominant ASN in this cluster
    const asns: Record<string, number> = {};
    clusterOrigins.forEach((o) => { asns[o.asn] = (asns[o.asn] || 0) + 1; });
    const dominantAsn = Object.entries(asns).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Multiple ASNs';

    let tier: ThreatDensityCluster['densityTier'] = 'MODERATE';
    if (totalDensityScore >= 240 || clusterOrigins.length >= 5) tier = 'CRITICAL';
    else if (totalDensityScore >= 140 || clusterOrigins.length >= 3) tier = 'HIGH';
    else if (totalDensityScore >= 70) tier = 'ELEVATED';

    clusters.push({
      id: `cluster-${hub.id}`,
      name: hub.name,
      region: hub.region,
      country: hub.country,
      coordinates: hub.coords,
      origins: clusterOrigins,
      totalDensityScore,
      avgThreatScore,
      densityTier: tier,
      radiusKm: Math.min(480, 120 + clusterOrigins.length * 40),
      dominantAsn,
      subpoenaRiskProfile: hub.subpoenaRiskProfile
    });
  });

  // Group remaining unassigned origins by geographic proximity (1200km)
  unassigned.forEach((origin) => {
    let merged = false;
    for (const cluster of clusters) {
      if (haversineDistance(origin.coordinates, cluster.coordinates) < 1200) {
        cluster.origins.push(origin);
        cluster.totalDensityScore += origin.threatDensityWeight;
        cluster.avgThreatScore = Math.round(
          cluster.origins.reduce((acc, o) => acc + o.threatScore, 0) / cluster.origins.length
        );
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        id: `cluster-loc-${origin.id}`,
        name: `${origin.city} Threat Footprint`,
        region: origin.region,
        country: origin.country,
        coordinates: origin.coordinates,
        origins: [origin],
        totalDensityScore: origin.threatDensityWeight,
        avgThreatScore: origin.threatScore,
        densityTier: origin.threatDensityWeight > 80 ? 'HIGH' : 'MODERATE',
        radiusKm: 160,
        dominantAsn: origin.asn,
        subpoenaRiskProfile: `${origin.jurisdiction} Regulatory Ingress`
      });
    }
  });

  return clusters.sort((a, b) => b.totalDensityScore - a.totalDensityScore);
}

/**
 * Computes sovereign country threat footprint density counts and max scores
 */
export function computeCountryDensityMap(origins: MappedOrigin[]): Record<string, { count: number; totalDensity: number; avgThreat: number }> {
  const map: Record<string, { count: number; totalDensity: number; avgThreat: number }> = {};
  origins.forEach((o) => {
    const key = o.countryCode || o.country;
    if (!map[key]) {
      map[key] = { count: 0, totalDensity: 0, avgThreat: 0 };
    }
    map[key].count += 1;
    map[key].totalDensity += o.threatDensityWeight;
  });

  Object.keys(map).forEach((k) => {
    map[k].avgThreat = Math.round(map[k].totalDensity / map[k].count);
  });

  return map;
}

/**
 * Analyzes the holistic geographical footprint and legal threat posture of all detected origins
 */
export function computeGeographicalThreatReport(origins: MappedOrigin[]) {
  if (origins.length === 0) {
    return {
      totalOrigins: 0,
      uniqueCountries: 0,
      uniqueCities: 0,
      fiveEyesCount: 0,
      fiveEyesPercent: 0,
      euGdprCount: 0,
      euGdprPercent: 0,
      sanctuaryCount: 0,
      sanctuaryPercent: 0,
      highPhysicalRiskCount: 0,
      physicalRiskAlerts: [] as string[],
      dominantJurisdiction: 'None',
      dominantRegion: 'None',
      dispersionProfile: 'No Footprint Detected',
      legalExposureIndex: 0,
      topCountries: [] as { country: string; count: number }[],
    };
  }

  const countryCounts: Record<string, number> = {};
  const regionCounts: Record<string, number> = {};
  let fiveEyes = 0;
  let euGdpr = 0;
  let sanctuary = 0;
  let highPhysical = 0;
  const physicalAlerts: string[] = [];
  let threatSum = 0;

  origins.forEach((o) => {
    countryCounts[o.country] = (countryCounts[o.country] || 0) + 1;
    regionCounts[o.region] = (regionCounts[o.region] || 0) + 1;
    threatSum += o.threatScore;

    if (o.jurisdiction === 'Five Eyes') fiveEyes++;
    if (o.jurisdiction === 'EU / GDPR') euGdpr++;
    if (o.jurisdiction === 'Swiss Sanctuary') sanctuary++;
    if (o.physicalRisk === 'high') {
      highPhysical++;
      physicalAlerts.push(`${o.platformName} (${o.threatNotes})`);
    }
  });

  const uniqueCountries = Object.keys(countryCounts).length;
  const uniqueCities = new Set(origins.map((o) => o.city)).size;
  const fiveEyesPercent = Math.round((fiveEyes / origins.length) * 100);
  const euGdprPercent = Math.round((euGdpr / origins.length) * 100);
  const sanctuaryPercent = Math.round((sanctuary / origins.length) * 100);

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  const dominantRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  const dominantJurisdiction =
    fiveEyes >= euGdpr && fiveEyes >= sanctuary
      ? 'Five Eyes Alliance'
      : euGdpr >= sanctuary
      ? 'European Union / GDPR'
      : 'Swiss Sanctuary / Offshore';

  let dispersionProfile = 'Concentrated Regional Footprint';
  if (uniqueCountries >= 4) {
    dispersionProfile = 'Intercontinental Transnational Footprint';
  } else if (uniqueCountries >= 2) {
    dispersionProfile = 'Bi-Regional Multi-Jurisdiction Footprint';
  }

  const legalExposureIndex = Math.min(100, Math.round(threatSum / origins.length));

  return {
    totalOrigins: origins.length,
    uniqueCountries,
    uniqueCities,
    fiveEyesCount: fiveEyes,
    fiveEyesPercent,
    euGdprCount: euGdpr,
    euGdprPercent,
    sanctuaryCount: sanctuary,
    sanctuaryPercent,
    highPhysicalRiskCount: highPhysical,
    physicalRiskAlerts: physicalAlerts,
    dominantJurisdiction,
    dominantRegion,
    dispersionProfile,
    legalExposureIndex,
    topCountries,
  };
}
