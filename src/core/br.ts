// Brazilian public-registry helpers (company level only).

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCnpj(input: string): boolean {
  const cnpj = onlyDigits(input);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const check = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(cnpj[i]), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13]);
}

export interface CompanySummary {
  cnpj: string;
  legalName: string | null;
  tradeName: string | null;
  status: string | null;
  openedAt: string | null;
  mainActivity: string | null;
  city: string | null;
  state: string | null;
  partnerCount: number;
  source: 'brasilapi.com.br';
}

/** Keeps company-level fields only. Individual partner names are intentionally dropped (LGPD data minimization). */
export function summarizeBrasilApiCnpj(raw: any): CompanySummary {
  return {
    cnpj: String(raw?.cnpj ?? ''),
    legalName: raw?.razao_social ?? null,
    tradeName: raw?.nome_fantasia || null,
    status: raw?.descricao_situacao_cadastral ?? null,
    openedAt: raw?.data_inicio_atividade ?? null,
    mainActivity: raw?.cnae_fiscal_descricao ?? null,
    city: raw?.municipio ?? null,
    state: raw?.uf ?? null,
    partnerCount: Array.isArray(raw?.qsa) ? raw.qsa.length : 0,
    source: 'brasilapi.com.br',
  };
}
