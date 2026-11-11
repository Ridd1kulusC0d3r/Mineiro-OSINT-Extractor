import { describe, expect, it } from 'vitest';
import { analyzeTarget, extractHandleFromProfileUrl, type ProfilePattern } from '../src/core/target';

const patterns: ProfilePattern[] = [
  { id: 'github', urlPattern: 'https://github.com/{username}' },
  { id: 'reddit', urlPattern: 'https://www.reddit.com/user/{username}' },
  { id: 'tumblr', urlPattern: 'https://{username}.tumblr.com' },
  { id: 'emailish', urlPattern: 'https://example.com/lookup/{email}' },
];

describe('extractHandleFromProfileUrl', () => {
  it('reads the handle from path and subdomain patterns', () => {
    expect(extractHandleFromProfileUrl('https://github.com/forgejo', patterns)).toEqual({ handle: 'forgejo', platformId: 'github' });
    expect(extractHandleFromProfileUrl('https://www.reddit.com/user/spez/', patterns)?.handle).toBe('spez');
    expect(extractHandleFromProfileUrl('https://demo.tumblr.com', patterns)).toEqual({ handle: 'demo', platformId: 'tumblr' });
    expect(extractHandleFromProfileUrl('https://github.com/forgejo?tab=repositories', patterns)?.handle).toBe('forgejo');
  });
  it('ignores non-profile URLs, non-URLs and email-style patterns', () => {
    expect(extractHandleFromProfileUrl('https://github.com/forgejo/forgejo/issues', patterns)).toBeNull();
    expect(extractHandleFromProfileUrl('forgejo', patterns)).toBeNull();
    expect(extractHandleFromProfileUrl('https://example.com/lookup/a@b.co', patterns)).toBeNull();
  });
});

describe('analyzeTarget', () => {
  it('normalises a leading @ and surrounding whitespace', () => {
    expect(analyzeTarget('  @forgejo ', 'username')).toEqual({ clean: 'forgejo' });
    expect(analyzeTarget('', 'username')).toEqual({ clean: '' });
  });
  it('suggests the handle for a pasted profile URL', () => {
    expect(analyzeTarget('https://github.com/forgejo', 'username', patterns)).toMatchObject({ issue: 'profile_url', suggestion: 'forgejo', platformId: 'github' });
  });
  it('detects an e-mail typed in username mode and spaces in usernames', () => {
    expect(analyzeTarget('Ana@Example.org', 'username')).toMatchObject({ issue: 'looks_like_email', suggestion: 'ana@example.org' });
    expect(analyzeTarget('john smith', 'username')).toMatchObject({ issue: 'has_spaces', suggestion: 'johnsmith' });
  });
  it('validates e-mail mode', () => {
    expect(analyzeTarget('Ana@Example.org', 'email')).toEqual({ clean: 'ana@example.org' });
    expect(analyzeTarget('forgejo', 'email')).toMatchObject({ issue: 'invalid_email' });
  });
});

import { readVerifyOutcome } from '../src/core/verifyOutcome';

describe('readVerifyOutcome', () => {
  it('passes a normal verdict through', () => {
    expect(readVerifyOutcome(true, 200, { status: 'found', statusCode: 200 })).toEqual({ status: 'found', statusCode: 200, uncertainReason: undefined });
    expect(readVerifyOutcome(true, 200, { status: 'not_found', statusCode: 404 }).status).toBe('not_found');
  });
  it('never turns a local refusal into "not found"', () => {
    const limited = readVerifyOutcome(false, 429, { error: 'Rate limit exceeded', limit: 'verify' });
    expect(limited.status).toBe('error');
    expect(limited.uncertainReason).toMatch(/Rate limit exceeded/);
    expect(readVerifyOutcome(false, 400, { error: 'URL does not match the detector pattern' }).status).toBe('error');
    expect(readVerifyOutcome(true, 200, {}).status).toBe('error');
    expect(readVerifyOutcome(true, 200, { status: 'weird' }).status).toBe('error');
  });
});
