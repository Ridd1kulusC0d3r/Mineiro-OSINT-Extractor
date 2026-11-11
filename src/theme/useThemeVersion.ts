import { useEffect, useState } from 'react';
import { THEME_CHANGE_EVENT } from './theme';

/** Número que muda a cada troca de tema; use como dependência de efeitos que pintam com cores resolvidas. */
export function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(THEME_CHANGE_EVENT, bump);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, bump);
  }, []);
  return version;
}
