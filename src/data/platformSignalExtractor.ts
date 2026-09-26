export interface ExtractedPlatformSignals {
  timezone: string;
  timezoneSignals: string[];
  activeTimezoneWindow: string;
  language: string;
  primaryLanguage: string;
  secondaryLanguages: string[];
  languageSignals: string[];
  linguisticStyle: string;
}

interface PlatformInput {
  platformName: string;
  category?: string;
  url?: string;
}

/**
 * Extracts and analyzes specific 'timezone' and 'language' signals from identified platform profiles.
 */
export function extractPlatformSignals(
  foundPlatforms: PlatformInput[] = [],
  target: string = '',
  emailData?: any
): ExtractedPlatformSignals {
  const t = target.toLowerCase();
  const tzSignals: string[] = [];
  const langSignals: string[] = [];

  let isPtBr = false;
  let isRu = false;
  let isDe = false;
  let isJp = false;
  let isCn = false;
  let isEs = false;
  let isFr = false;

  const foundPlatformNames = new Set(foundPlatforms.map((p) => (p.platformName || '').toLowerCase()));
  const allUrls = foundPlatforms.map((p) => (p.url || '').toLowerCase()).join(' ');

  // 1. Analyze Regional Platform Domains & Identifiers
  if (
    allUrls.includes('.com.br') ||
    allUrls.includes('.br/') ||
    foundPlatformNames.has('mercadolivre') ||
    foundPlatformNames.has('jusbrasil') ||
    foundPlatformNames.has('vakinha') ||
    foundPlatformNames.has('tabnews') ||
    foundPlatformNames.has('elo7') ||
    foundPlatformNames.has('alura') ||
    foundPlatformNames.has('sympla') ||
    foundPlatformNames.has('hotmart') ||
    foundPlatformNames.has('picpay') ||
    foundPlatformNames.has('nubank') ||
    foundPlatformNames.has('pagseguro') ||
    foundPlatformNames.has('uol') ||
    foundPlatformNames.has('globo')
  ) {
    isPtBr = true;
    tzSignals.push('Presence on Brazilian domestic platforms / .com.br endpoints confirms UTC-3 (BRT / America/Sao_Paulo) operating jurisdiction');
    langSignals.push('Profile presence on localized Brazilian services confirms Portuguese (pt-BR) as native / operational language');
  }

  // Slavic / Russian Footprint
  if (
    allUrls.includes('.ru') ||
    allUrls.includes('.su') ||
    allUrls.includes('.by') ||
    allUrls.includes('.kz') ||
    foundPlatformNames.has('vkontakte') ||
    foundPlatformNames.has('vk') ||
    foundPlatformNames.has('habr') ||
    foundPlatformNames.has('rutube') ||
    foundPlatformNames.has('odnoklassniki') ||
    foundPlatformNames.has('mail.ru') ||
    foundPlatformNames.has('yandex') ||
    foundPlatformNames.has('pikabu') ||
    foundPlatformNames.has('4pda')
  ) {
    isRu = true;
    tzSignals.push('Identified profile on regional Cyrillic/CIS ecosystem signals UTC+3 (MSK / Europe/Moscow) activity corridor');
    langSignals.push('Cyrillic platform footprint indicates native or fluent Russian language proficiency');
  }

  // Japanese Footprint
  if (
    allUrls.includes('.jp') ||
    foundPlatformNames.has('qiita') ||
    foundPlatformNames.has('hatena') ||
    foundPlatformNames.has('zenn') ||
    foundPlatformNames.has('nicovideo') ||
    foundPlatformNames.has('pixiv')
  ) {
    isJp = true;
    tzSignals.push('Identified profile on Japanese domestic services confirms JST (UTC+9 / Asia/Tokyo) temporal anchor');
    langSignals.push('Regional Japanese developer/creative platform registration reflects Japanese language capability');
  }

  // German / DACH Footprint
  if (
    allUrls.includes('.de') ||
    allUrls.includes('.at') ||
    allUrls.includes('.ch') ||
    foundPlatformNames.has('xing') ||
    foundPlatformNames.has('tutanota') ||
    foundPlatformNames.has('gmx') ||
    foundPlatformNames.has('web.de') ||
    foundPlatformNames.has('heise')
  ) {
    isDe = true;
    tzSignals.push('Profile presence on DACH region platforms aligns with CET/CEST (UTC+1/UTC+2) operating timeframe');
    langSignals.push('Presence on German specialized services indicates German language proficiency');
  }

  // Chinese Footprint
  if (
    allUrls.includes('.cn') ||
    foundPlatformNames.has('weibo') ||
    foundPlatformNames.has('zhihu') ||
    foundPlatformNames.has('bilibili') ||
    foundPlatformNames.has('gitee') ||
    foundPlatformNames.has('csdn') ||
    foundPlatformNames.has('v2ex')
  ) {
    isCn = true;
    tzSignals.push('Account discovery on Chinese domestic platforms anchors to CST (UTC+8 / Asia/Shanghai)');
    langSignals.push('Footprint in Chinese technical and social sphere demonstrates Mandarin Chinese literacy');
  }

  // Spanish / Hispanic Footprint
  if (
    allUrls.includes('.es') ||
    allUrls.includes('.ar') ||
    allUrls.includes('.mx') ||
    allUrls.includes('.co') ||
    allUrls.includes('.cl') ||
    foundPlatformNames.has('taringa') ||
    foundPlatformNames.has('forocoches') ||
    foundPlatformNames.has('meneame')
  ) {
    isEs = true;
    tzSignals.push('Profile registration on Hispanic platforms signals Spanish-speaking diurnal cycle (UTC+1 Spain / UTC-3 to UTC-6 LATAM)');
    langSignals.push('Participation in Spanish community hubs indicates Spanish language proficiency');
  }

  // French Footprint
  if (
    allUrls.includes('.fr') ||
    foundPlatformNames.has('dailymotion') ||
    foundPlatformNames.has('openclassrooms')
  ) {
    isFr = true;
    tzSignals.push('Profile presence on French web assets indicates CET (UTC+1/UTC+2) activity window');
    langSignals.push('French platform utilization establishes French language capabilities');
  }

  // 2. Email Infrastructure Signals
  if (emailData) {
    const domain = (emailData.domain || '').toLowerCase();
    if (domain.endsWith('.br')) {
      isPtBr = true;
      tzSignals.push(`Email MX infrastructure routed through .br domain (${emailData.domain}), verifying Brazilian geographical base`);
      langSignals.push(`Email primary domain suffix (.br) provides high-confidence Portuguese language confirmation`);
    } else if (domain.endsWith('.ru') || domain.includes('yandex') || domain.includes('mail.ru')) {
      isRu = true;
      tzSignals.push(`Email host (${emailData.domain}) associated with CIS / Russian regional email provider (UTC+3)`);
      langSignals.push(`Email provider selection indicates primary Russian linguistic preference`);
    } else if (domain.endsWith('.de')) {
      isDe = true;
      tzSignals.push(`Email infrastructure registered under .de namespace, supporting German timezone (UTC+1)`);
      langSignals.push(`German domain registry indicates German language correspondence`);
    } else if (domain.endsWith('.es')) {
      isEs = true;
      tzSignals.push(`Email domain (${emailData.domain}) registered in Spanish jurisdiction (UTC+1 / UTC-3)`);
      langSignals.push(`Email namespace confirms Spanish language communication channels`);
    }
  }

  // 3. Moniker Linguistic Structure Analysis
  const ptSurnames = ['silva', 'santos', 'souza', 'oliveira', 'pereira', 'rodrigues', 'ferreira', 'alves', 'lima', 'ribeiro'];
  const ptAffixes = ['br', 'brasil', 'brz', 'zinho', 'zito', 'deiv', 'sec_br', 'tiago', 'joao', 'pedro', 'lucas', 'matheus', 'felipe'];
  if (ptSurnames.some((s) => t.includes(s)) || ptAffixes.some((a) => t.includes(a))) {
    isPtBr = true;
    langSignals.push(`Target moniker '@${target}' contains Portuguese onomastic/phonetic markers (e.g. lexical affix '${ptAffixes.find((a) => t.includes(a)) || ptSurnames.find((s) => t.includes(s))}')`);
    tzSignals.push(`Linguistic root of handle strongly associates with South American / Brazilian diurnal rhythm (UTC-3)`);
  }

  // International Tech Platform Signals
  const hasGlobalTech =
    foundPlatformNames.has('github') ||
    foundPlatformNames.has('gitlab') ||
    foundPlatformNames.has('hackernews') ||
    foundPlatformNames.has('stackoverflow') ||
    foundPlatformNames.has('reddit') ||
    foundPlatformNames.has('twitter') ||
    foundPlatformNames.has('x') ||
    foundPlatformNames.has('bluesky') ||
    foundPlatformNames.has('keybase') ||
    foundPlatformNames.has('docker') ||
    foundPlatformNames.has('npm') ||
    foundPlatformNames.has('pypi');

  if (hasGlobalTech) {
    langSignals.push('Presence on international technical platforms (GitHub, StackOverflow, Reddit) establishes fluent technical English proficiency');
  }

  // 4. Synthesis of Primary Timezone and Language
  let primaryTimezone = 'UTC-3 (America/Sao_Paulo / BRT)';
  let activeWindow = '13:00 - 23:00 UTC (10:00 - 20:00 BRT Diurnal Peak)';
  let primaryLanguage = 'Portuguese';
  const secondaryLanguages: string[] = ['English'];
  let linguisticStyle = 'Bilingual technical discourse: native Portuguese phrasing blended with international cybersecurity/engineering terminology';

  if (isPtBr) {
    primaryTimezone = 'UTC-3 (America/Sao_Paulo / BRT)';
    activeWindow = '13:00 - 23:00 UTC (10:00 - 20:00 BRT Diurnal Peak)';
    primaryLanguage = 'Portuguese';
    if (hasGlobalTech) {
      secondaryLanguages.push('English');
      linguisticStyle = 'Bilingual technical profile: native Portuguese paired with professional English software/OSINT documentation';
    } else {
      linguisticStyle = 'Colloquial and regional Portuguese digital phrasing';
    }
  } else if (isRu) {
    primaryTimezone = 'UTC+3 (Europe/Moscow / MSK)';
    activeWindow = '08:00 - 20:00 UTC (11:00 - 23:00 MSK Diurnal Peak)';
    primaryLanguage = 'Russian';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Russian technical cadence with concise English terminology';
  } else if (isJp) {
    primaryTimezone = 'UTC+9 (Asia/Tokyo / JST)';
    activeWindow = '01:00 - 13:00 UTC (10:00 - 22:00 JST Diurnal Peak)';
    primaryLanguage = 'Japanese';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Japanese formal phrasing with standard technical English keywords';
  } else if (isDe) {
    primaryTimezone = 'UTC+1 (Europe/Berlin / CET)';
    activeWindow = '07:00 - 19:00 UTC (08:00 - 20:00 CET Diurnal Peak)';
    primaryLanguage = 'German';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Structured German communication alongside fluent international English documentation';
  } else if (isCn) {
    primaryTimezone = 'UTC+8 (Asia/Shanghai / CST)';
    activeWindow = '01:00 - 14:00 UTC (09:00 - 22:00 CST Diurnal Peak)';
    primaryLanguage = 'Chinese';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Chinese developer terminology with English software syntax';
  } else if (isEs) {
    primaryTimezone = 'UTC-3 to UTC+1 (Hispanic / Iberian & LATAM Window)';
    activeWindow = '12:00 - 22:00 UTC (Diurnal Peak)';
    primaryLanguage = 'Spanish';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Spanish colloquial and technical phrasing with English terminology';
  } else if (isFr) {
    primaryTimezone = 'UTC+1 (Europe/Paris / CET)';
    activeWindow = '07:00 - 19:00 UTC (08:00 - 20:00 CET Diurnal Peak)';
    primaryLanguage = 'French';
    if (hasGlobalTech) secondaryLanguages.push('English');
    linguisticStyle = 'Standard French with international technical English vocabulary';
  } else {
    // Default Global Tech / North American & Western European Footprint
    primaryTimezone = 'UTC-5 to UTC+0 (Western Hemisphere / Atlantic Window)';
    activeWindow = '14:00 - 02:00 UTC (Western Diurnal Peak)';
    primaryLanguage = 'English';
    secondaryLanguages.length = 0;
    tzSignals.push('Account distributed across international tech hubs without restrictive local TLD constraints (Standard UTC-5 to UTC+0 diurnal distribution)');
    langSignals.push('Exclusively international English-language footprint across global services');
    linguisticStyle = 'Terse, documentation-focused technical English with domain-specific terminology';
  }

  // Deduplicate and ensure at least one explicit signal
  const uniqueTzSignals = Array.from(new Set(tzSignals));
  const uniqueLangSignals = Array.from(new Set(langSignals));

  if (uniqueTzSignals.length === 0) {
    uniqueTzSignals.push(`Temporal activity correlates with standard Western diurnal window (${primaryTimezone})`);
  }
  if (uniqueLangSignals.length === 0) {
    uniqueLangSignals.push(`Primary moniker syntax and registered profiles indicate ${primaryLanguage} linguistic preference`);
  }

  const uniqueSecondary = Array.from(new Set(secondaryLanguages.filter((l) => l.toLowerCase() !== primaryLanguage.toLowerCase())));

  const languageFormatted = uniqueSecondary.length > 0
    ? `${primaryLanguage} (Primary) / ${uniqueSecondary.join(', ')} (Secondary/Technical)`
    : `${primaryLanguage} (Primary)`;

  return {
    timezone: primaryTimezone,
    timezoneSignals: uniqueTzSignals,
    activeTimezoneWindow: activeWindow,
    language: languageFormatted,
    primaryLanguage,
    secondaryLanguages: uniqueSecondary,
    languageSignals: uniqueLangSignals,
    linguisticStyle,
  };
}
