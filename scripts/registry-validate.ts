import { MINEIRO_REGISTRY } from '../src/registry/registry';

const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();

for (const detector of MINEIRO_REGISTRY) {
  if (!detector.id.trim()) errors.push('Detector with empty id');
  if (ids.has(detector.id)) errors.push(`Duplicate detector id: ${detector.id}`);
  ids.add(detector.id);

  if (!detector.name.trim()) errors.push(`${detector.id}: empty name`);
  if (!detector.urlPattern.includes('{username}') && !detector.urlPattern.includes('{email}')) {
    warnings.push(`${detector.id}: URL pattern has no target placeholder`);
  }
  if (!/^https?:\/\//.test(detector.urlPattern)) {
    errors.push(`${detector.id}: URL pattern must be HTTP(S)`);
  }
  if (detector.detectorReliability < 0 || detector.detectorReliability > 100) {
    errors.push(`${detector.id}: detectorReliability outside 0-100`);
  }
  if (!detector.siteType.trim()) warnings.push(`${detector.id}: missing siteType`);
  if (!detector.licenseStatus.trim()) warnings.push(`${detector.id}: missing licenseStatus`);
  if (!detector.provenanceStatus) warnings.push(`${detector.id}: missing provenanceStatus`);
}

console.log(`Validated ${MINEIRO_REGISTRY.length} registry detectors.`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length})`);
  warnings.slice(0, 30).forEach((item) => console.log(`- ${item}`));
  if (warnings.length > 30) console.log(`... ${warnings.length - 30} additional warnings`);
}

if (errors.length) {
  console.error(`\nErrors (${errors.length})`);
  errors.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('\nRegistry validation passed.');
