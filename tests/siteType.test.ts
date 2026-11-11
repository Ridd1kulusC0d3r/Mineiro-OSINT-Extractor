// Site types of the catalog (baseline defect 13): the category decides, the text only refines within it.
import { describe, expect, it } from 'vitest';
import { PLATFORMS_DATABASE } from '../src/data/platforms';
import { inferSiteType, SITE_TYPES } from '../src/data/siteType';

const typeOf = (id: string) => PLATFORMS_DATABASE.find((p) => p.id === id)?.siteType;

describe('catalog site types', () => {
  it.each([
    ['spotify', 'music_audio'],
    ['steam', 'gaming'],
    ['instagram', 'social_network'],
    ['tiktok', 'social_network'],
    ['github', 'developer_platform'],
    ['npm', 'package_registry'],
    ['youtube', 'video_streaming'],
    ['twitch', 'gaming'],
    ['flickr', 'photo_media'],
    ['paypal', 'finance_payments'],
  ])('%s is %s', (id, type) => {
    expect(typeOf(id)).toBe(type);
  });

  it('gives every entry a known type', () => {
    for (const platform of PLATFORMS_DATABASE) expect(SITE_TYPES).toContain(platform.siteType);
  });

  it('does not match a keyword inside another word', () => {
    // "digital" contains "git", "steamcommunity" contains "community".
    expect(inferSiteType({ category: 'creative', name: 'X', description: 'Digital art storefront', urlPattern: 'https://x.example/{username}' })).toBe('creative_portfolio');
    expect(inferSiteType({ category: 'developer', name: 'X', description: 'Digital tools', urlPattern: 'https://steamcommunity.example/{username}' })).toBe('developer_platform');
  });

  it('keeps the category when the text points at a type that does not fit it', () => {
    expect(inferSiteType({ category: 'social', name: 'X', description: 'Short video sharing', urlPattern: 'https://x.example/@{username}' })).toBe('social_network');
    expect(inferSiteType({ category: 'gaming', name: 'X', description: 'Game streaming and video', urlPattern: 'https://x.example/{username}' })).toBe('gaming');
  });
});
