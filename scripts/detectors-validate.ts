import { MINEIRO_REGISTRY } from '../src/registry/registry';
import { loadDeclarativeDetectors } from '../server/detectors';

const { detectors, errors } = loadDeclarativeDetectors();
const registryIds = new Set(MINEIRO_REGISTRY.map((d) => d.id));

for (const id of detectors.keys()) {
  if (!registryIds.has(id)) errors.push(`declarative detector "${id}" has no registry entry`);
}

console.log(`Validated ${detectors.size} declarative detector(s).`);
if (errors.length) {
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}
