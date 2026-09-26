import { getRegistryStats } from '../src/registry/registry';

const stats = getRegistryStats();

console.log('\nMineiro Registry v1.4.1');
console.log('---------------------');
console.log(`Detectors:               ${stats.totalDetectors}`);
console.log(`Evidence checks:         ${stats.logicalEvidenceChecks}`);
console.log(`Checks per detector:     ${stats.evidenceChecksPerDetector}`);
console.log(`Average reliability:     ${stats.averageReliability}/100`);
console.log(`Verified provenance:     ${stats.verifiedDetectors}`);
console.log(`Pending provenance audit:${stats.auditRequiredDetectors}`);
console.log(`Scannable detectors:      ${stats.scannableDetectors}`);
console.log(`Registry-only detectors:  ${stats.registryOnlyDetectors}`);

console.log('\nBy category');
for (const item of stats.byCategory) {
  console.log(`- ${item.key.padEnd(12)} ${String(item.count).padStart(4)}  ${item.percent}%`);
}

console.log('\nReliability tiers');
for (const item of stats.byReliabilityTier) {
  console.log(`- ${item.key.padEnd(12)} ${String(item.count).padStart(4)}  ${item.percent}%`);
}
