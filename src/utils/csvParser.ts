import { BulkBatchState, BulkTargetItem } from '../types';

export interface ParsedTarget {
  id: string;
  target: string;
  type: 'username' | 'email';
  notes?: string;
  isValid: boolean;
  validationError?: string;
}

export interface CsvParseResult {
  items: ParsedTarget[];
  totalParsed: number;
  validCount: number;
  duplicateCount: number;
  usernameCount: number;
  emailCount: number;
  errors: string[];
}

/**
 * Split CSV line respecting quoted strings with commas
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  return values.map((val) => val.replace(/^["']|["']$/g, '').trim());
}

/**
 * Detect most likely delimiter (, or ; or \t)
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

/**
 * Check if string matches email pattern
 */
export function isEmailFormat(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/**
 * Clean username/email input
 */
export function cleanTargetIdentifier(val: string): string {
  let cleaned = val.trim();
  // Strip leading '@' if handle
  if (cleaned.startsWith('@') && !cleaned.includes(' ')) {
    cleaned = cleaned.substring(1).trim();
  }
  return cleaned;
}

/**
 * Parse raw CSV or plaintext target list
 */
export function parseTargetCsv(
  rawContent: string,
  options: { deduplicate?: boolean } = { deduplicate: true }
): CsvParseResult {
  const errors: string[] = [];
  const lines = rawContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return {
      items: [],
      totalParsed: 0,
      validCount: 0,
      duplicateCount: 0,
      usernameCount: 0,
      emailCount: 0,
      errors: ['The provided file or text is empty.'],
    };
  }

  const delimiter = detectDelimiter(rawContent);
  const headerTokens = splitCsvLine(lines[0].toLowerCase(), delimiter);

  // Check if first line is a header row
  const headerIndices = {
    target: -1,
    type: -1,
    notes: -1,
  };

  headerTokens.forEach((tok, idx) => {
    const cleanTok = tok.replace(/[^a-z0-9_]/g, '');
    if (['target', 'username', 'handle', 'identifier', 'account', 'query', 'user', 'name'].includes(cleanTok)) {
      if (headerIndices.target === -1) headerIndices.target = idx;
    } else if (['type', 'targettype', 'mode', 'category'].includes(cleanTok)) {
      headerIndices.type = idx;
    } else if (['notes', 'note', 'comment', 'description', 'role', 'tag'].includes(cleanTok)) {
      headerIndices.notes = idx;
    } else if (cleanTok === 'email' && headerIndices.target === -1) {
      headerIndices.target = idx;
    }
  });

  const hasHeader = headerIndices.target !== -1 || ['target', 'username', 'email'].some((kw) => lines[0].toLowerCase().includes(kw));
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const targetColIdx = headerIndices.target !== -1 ? headerIndices.target : 0;

  const seen = new Set<string>();
  let duplicateCount = 0;
  const parsedItems: ParsedTarget[] = [];

  dataLines.forEach((line, lineNum) => {
    const tokens = splitCsvLine(line, delimiter);
    if (!tokens.length || (tokens.length === 1 && !tokens[0])) return;

    let rawVal = tokens[targetColIdx] || tokens[0] || '';
    let target = cleanTargetIdentifier(rawVal);
    let specifiedType = headerIndices.type !== -1 ? tokens[headerIndices.type]?.toLowerCase() : undefined;
    let notes = headerIndices.notes !== -1 ? tokens[headerIndices.notes] : undefined;

    if (!target) return;

    // Determine type (username vs email)
    const isEmail = isEmailFormat(target) || specifiedType === 'email';
    const detectedType: 'username' | 'email' = isEmail ? 'email' : 'username';

    // Validation
    let isValid = true;
    let validationError: string | undefined;

    if (detectedType === 'email') {
      if (!isEmailFormat(target)) {
        isValid = false;
        validationError = 'Invalid email syntax';
      }
    } else {
      if (target.length < 1 || target.length > 60) {
        isValid = false;
        validationError = 'Handle length should be 1-60 characters';
      } else if (/[\s<>"'{}]/.test(target)) {
        isValid = false;
        validationError = 'Handle contains invalid characters';
      }
    }

    const uniqueKey = `${detectedType}:${target.toLowerCase()}`;
    if (seen.has(uniqueKey)) {
      duplicateCount++;
      if (options.deduplicate) {
        return; // skip duplicate
      }
    }
    seen.add(uniqueKey);

    parsedItems.push({
      id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      target,
      type: detectedType,
      notes: notes || undefined,
      isValid,
      validationError,
    });
  });

  const validCount = parsedItems.filter((i) => i.isValid).length;
  const usernameCount = parsedItems.filter((i) => i.isValid && i.type === 'username').length;
  const emailCount = parsedItems.filter((i) => i.isValid && i.type === 'email').length;

  return {
    items: parsedItems,
    totalParsed: parsedItems.length,
    validCount,
    duplicateCount,
    usernameCount,
    emailCount,
    errors,
  };
}

/**
 * Generate standard sample CSV string for users to download as a template
 */
export function generateSampleCsv(): string {
  return [
    'target,type,notes',
    'satoshi,username,Bitcoin creator handle',
    'deivsec,username,Lead security target',
    'vitalik,username,Ethereum founder',
    'octocat,username,GitHub mascot',
    'torvalds,username,Linux author',
    'defunkt,username,GitHub co-founder',
    'analyst@domain.com,email,Example corporate email',
  ].join('\n');
}

/**
 * Download sample CSV file to client browser
 */
export function downloadSampleCsvTemplate() {
  const csvContent = generateSampleCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'mineiro_bulk_targets_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export consolidated batch results to CSV
 */
export function exportBatchToCsv(batch: BulkBatchState): void {
  const headers = [
    'Target',
    'Target_Type',
    'Status',
    'Discovered_Hits',
    'Uncertain_WAF',
    'Total_Platforms_Scanned',
    'Notes',
    'Found_Platforms',
    'Found_URLs',
    'Started_At',
    'Completed_At',
  ];

  const rows = batch.items.map((item) => {
    const foundList = (item.results || []).filter((r) => r.status === 'found');
    const foundPlatformNames = foundList.map((r) => r.platformName).join('; ');
    const foundUrls = foundList.map((r) => r.url).join('; ');

    return [
      `"${item.target}"`,
      `"${item.type.toUpperCase()}"`,
      `"${item.status.toUpperCase()}"`,
      item.foundCount,
      item.uncertainCount,
      item.totalScanned,
      `"${item.notes || ''}"`,
      `"${foundPlatformNames}"`,
      `"${foundUrls}"`,
      `"${item.startedAt || ''}"`,
      `"${item.completedAt || ''}"`,
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `mineiro_bulk_recon_batch_${batch.batchId}_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export consolidated batch results to JSON
 */
export function exportBatchToJson(batch: BulkBatchState): void {
  const payload = {
    engine: 'Mineiro Username Extractor Unified OSINT Reconnaissance Engine',
    version: '3.0.0',
    batchId: batch.batchId,
    batchName: batch.name,
    exportedAt: new Date().toISOString(),
    metrics: {
      totalTargets: batch.items.length,
      completedTargets: batch.items.filter((i) => i.status === 'completed').length,
      totalDiscoveredHits: batch.items.reduce((acc, i) => acc + (i.foundCount || 0), 0),
      categoryScope: batch.selectedCategory,
      concurrency: batch.concurrency,
    },
    targets: batch.items.map((item) => ({
      target: item.target,
      type: item.type,
      status: item.status,
      discoveredHits: item.foundCount,
      uncertainCount: item.uncertainCount,
      totalScanned: item.totalScanned,
      notes: item.notes,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      emailRecon: item.emailData,
      aiProfileSummary: item.aiProfile
        ? {
            archetype: item.aiProfile.archetype,
            threatLevel: item.aiProfile.threatLevel,
            footprintScore: item.aiProfile.footprintScore,
            summary: item.aiProfile.summary,
          }
        : null,
      foundProfiles: (item.results || [])
        .filter((r) => r.status === 'found')
        .map((r) => ({
          platform: r.platformName,
          category: r.category,
          url: r.url,
          statusCode: r.statusCode,
          confidenceScore: r.confidenceScore,
        })),
    })),
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `mineiro_bulk_recon_batch_${batch.batchId}_${new Date().toISOString().split('T')[0]}.json`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
