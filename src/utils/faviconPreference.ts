import { useEffect, useState } from 'react';

/**
 * Ícones de site remotos (favicons do Google e do DuckDuckGo): desligados por padrão.
 *
 * Mineiro é local-first; abrir o app não pode falar com terceiros. Por padrão cada plataforma aparece com um
 * monograma local. Quem quiser os ícones reais liga a opção na barra das abas Evidence e Platforms; a escolha fica
 * em localStorage na chave abaixo ("1" = ligado; ausente ou qualquer outro valor = desligado). Ligada, cada ícone
 * é uma requisição a www.google.com (e, se falhar, a icons.duckduckgo.com) com o domínio da plataforma.
 */
export const REMOTE_FAVICONS_STORAGE_KEY = 'mineiro_remote_favicons';
const CHANGE_EVENT = 'mineiro:remote-favicons';

export function getRemoteFaviconsEnabled(): boolean {
  try {
    return localStorage.getItem(REMOTE_FAVICONS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setRemoteFaviconsEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(REMOTE_FAVICONS_STORAGE_KEY, '1');
    else localStorage.removeItem(REMOTE_FAVICONS_STORAGE_KEY);
  } catch {
    // Sem armazenamento a escolha vale só para esta sessão.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: enabled }));
}

/** Estado atual da opção; todos os componentes que usam o hook mudam juntos. */
export function useRemoteFavicons(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(getRemoteFaviconsEnabled);
  useEffect(() => {
    const sync = (event: Event) => setEnabled(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);
  return [enabled, setRemoteFaviconsEnabled];
}
