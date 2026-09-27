import { uiMessages } from '../src/utils/i18n';
import { analysisText, requirementLabel } from '../src/intelligence/localization';

const locales = ['en', 'pt', 'es'] as const;
const enKeys = Object.keys(uiMessages.en).sort();

for (const locale of locales) {
  const keys = Object.keys(uiMessages[locale]).sort();
  if (keys.length !== enKeys.length) {
    throw new Error(`Locale ${locale} has ${keys.length} UI keys; expected ${enKeys.length}.`);
  }
  for (let i = 0; i < enKeys.length; i++) {
    if (keys[i] !== enKeys[i]) throw new Error(`Locale ${locale} is missing UI key ${enKeys[i]}.`);
    const value = uiMessages[locale][enKeys[i] as keyof typeof uiMessages.en];
    if (!String(value).trim()) throw new Error(`Locale ${locale} has an empty value for ${enKeys[i]}.`);
  }
}

if (uiMessages.en['header.report'] === uiMessages.pt['header.report']) {
  throw new Error('English and Portuguese header translations unexpectedly match.');
}
if (uiMessages.pt['header.report'] === uiMessages.es['header.report']) {
  throw new Error('Portuguese and Spanish header translations unexpectedly match.');
}

for (const locale of locales) {
  const requirement = requirementLabel(locale, 'account_correlation');
  const evidence = analysisText(locale, 'evidence_lead');
  if (!requirement.trim() || !evidence.trim()) throw new Error(`Analytical localization missing for ${locale}.`);
}

if (analysisText('pt', 'gap2_q') === analysisText('en', 'gap2_q')) {
  throw new Error('Analytical gap localization did not change across locales.');
}

console.log(`[PASS] i18n catalogs validated: ${enKeys.length} UI keys across 3 languages plus analytical narratives.`);
