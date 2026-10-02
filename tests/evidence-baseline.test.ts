import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compareToBaseline, fingerprintPage } from '../src/core/baseline';
import { evaluateEvidence } from '../src/core/evidence';

const load = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('evaluateEvidence', () => {
  it('passes most checks for a real profile', () => {
    const body = load('profile-exists.html');
    const result = evaluateEvidence({
      requestedUrl: 'https://example.com/pascho', finalUrl: 'https://example.com/pascho', username: 'pascho',
      statusCode: 200, expectedStatus: 200, errorStatus: 404, body, edgeProtected: false,
    });
    expect(result.soft404).toBe(false);
    expect(result.passed).toBeGreaterThanOrEqual(7);
  });

  it('flags generic error shells as soft-404', () => {
    const result = evaluateEvidence({
      requestedUrl: 'https://example.com/zz', finalUrl: 'https://example.com/zz', username: 'zz',
      statusCode: 200, expectedStatus: 200, errorStatus: 404, body: 'Page not found', edgeProtected: false,
    });
    expect(result.soft404).toBe(true);
  });
});

describe('differential baseline', () => {
  const fp = (file: string, handle: string, path = ':h', status = 200) =>
    fingerprintPage({ status, finalUrl: `https://example.com/${path.replace(':h', handle)}`, body: load(file), handle });

  it('treats a 200 "not found" shell identical to the control as absent', () => {
    const target = fp('profile-soft404-a.html', 'pascho');
    const control = fp('profile-soft404-a.html', 'zqcontrol123');
    expect(compareToBaseline(target, control).relation).toBe('same');
  });

  it('distinguishes a real profile from the control template', () => {
    const target = fp('profile-exists.html', 'pascho');
    const control = fp('profile-soft404-a.html', 'zqcontrol123');
    expect(compareToBaseline(target, control).relation).toBe('different');
  });

  it('treats a differing status as differential evidence', () => {
    const target = fp('profile-exists.html', 'pascho');
    const control = fp('profile-soft404-a.html', 'zqcontrol123', ':h', 404);
    expect(compareToBaseline(target, control)).toMatchObject({ relation: 'different' });
  });

  it('returns unknown when the control was blocked', () => {
    const target = fp('profile-exists.html', 'pascho');
    const control = fp('profile-soft404-a.html', 'zqcontrol123', ':h', 429);
    expect(compareToBaseline(target, control).relation).toBe('unknown');
    expect(compareToBaseline(target, null).relation).toBe('unknown');
  });
});
