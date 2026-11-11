import { Image } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { useRemoteFavicons } from '../utils/faviconPreference';

interface AuditViewHeaderProps {
  title: string;
  hint: string;
}

/** Linha de título das abas Evidence e Platforms, com a opção (desligada por padrão) de ícones de site remotos. */
export function AuditViewHeader({ title, hint }: AuditViewHeaderProps) {
  const { tr } = useI18n();
  const [remoteIcons, setRemoteIcons] = useRemoteFavicons();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="eyebrow">{title}</span>
        <p className="mt-1 text-[13px] text-ink-3">{hint}</p>
      </div>
      <label
        className="chip cursor-pointer !normal-case !tracking-normal !font-sans !text-[12px] !font-medium hover:border-ink-3"
        title={tr('favicons.hint')}
      >
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-[var(--signal)]"
          checked={remoteIcons}
          onChange={(event) => setRemoteIcons(event.target.checked)}
        />
        <Image className="h-3.5 w-3.5" aria-hidden="true" />
        {tr('favicons.toggle')}
      </label>
    </div>
  );
}
