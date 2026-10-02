// STIX 2.1 export of Mineiro observations. Interoperable with MISP/OpenCTI.
// We emit observed *accounts* and the sightings of them; identity claims are never asserted.

import { createHash } from 'node:crypto';

export interface StixObservation {
  detectorId: string;
  platform: string;
  url: string;
  username: string;
  status: 'found' | 'not_found' | 'uncertain' | 'rate_limited' | 'error';
  confidence: number; // 0-100
  collectedAt: string;
  evidenceHash?: string;
  detectorVersion?: string;
}

// STIX ids must be UUIDs; derive v5-like deterministic ids so re-exports are stable and diffable.
function stixId(type: string, seed: string): string {
  const h = createHash('sha1').update(`mineiro:${type}:${seed}`).digest('hex');
  const uuid = `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${h.slice(18, 20)}-${h.slice(20, 32)}`;
  return `${type}--${uuid}`;
}

export function buildStixBundle(target: string, observations: StixObservation[], createdAt = new Date().toISOString()) {
  const identityId = stixId('identity', 'mineiro-osint-workbench');
  const objects: any[] = [
    {
      type: 'identity', spec_version: '2.1', id: identityId, created: createdAt, modified: createdAt,
      name: 'Mineiro OSINT Workbench', identity_class: 'system',
    },
  ];

  for (const obs of observations.filter((o) => o.status === 'found')) {
    const accountId = stixId('user-account', `${obs.detectorId}:${obs.username.toLowerCase()}`);
    const urlId = stixId('url', obs.url);
    const sightingKey = `${obs.detectorId}:${obs.username}:${obs.collectedAt}`;

    objects.push(
      { type: 'user-account', spec_version: '2.1', id: accountId, account_login: obs.username, account_type: obs.detectorId, display_name: obs.platform },
      { type: 'url', spec_version: '2.1', id: urlId, value: obs.url },
      {
        type: 'observed-data', spec_version: '2.1', id: stixId('observed-data', sightingKey),
        created: obs.collectedAt, modified: obs.collectedAt, created_by_ref: identityId,
        first_observed: obs.collectedAt, last_observed: obs.collectedAt, number_observed: 1,
        object_refs: [accountId, urlId],
        confidence: Math.max(0, Math.min(100, Math.round(obs.confidence))),
        x_mineiro_evidence_hash: obs.evidenceHash,
        x_mineiro_detector_version: obs.detectorVersion,
        x_mineiro_note: `Public account presence for "${target}" on ${obs.platform}. Presence is not proof of identity.`,
      }
    );
  }

  return { type: 'bundle', id: stixId('bundle', `${target}:${createdAt}`), objects };
}
