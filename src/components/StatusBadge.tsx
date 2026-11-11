import { AlertTriangle, Check, CircleDashed, Clock, Loader2, Minus, XCircle } from 'lucide-react';
import type { ScanResult } from '../types';
import { useI18n, type UiMessageKey } from '../utils/i18n';

type Status = ScanResult['status'];

/**
 * Status de uma sondagem. Rótulo, ícone e estilo de borda dizem o status (sólido = encontrado, tracejado = incerto,
 * pontilhado = ausente); o preenchimento em signal marca só a presença confirmada. Nada depende só de cor.
 */
const STATUS_STYLE: Record<Status, { cls: string; label: UiMessageKey; icon: typeof Check }> = {
  found: { cls: 'status-found', label: 'status.found', icon: Check },
  uncertain: { cls: 'status-uncertain', label: 'status.uncertain', icon: AlertTriangle },
  rate_limited: { cls: 'status-uncertain', label: 'status.rateLimited', icon: Clock },
  error: { cls: 'status-uncertain', label: 'status.error', icon: XCircle },
  not_found: { cls: 'status-absent', label: 'status.absent', icon: Minus },
  scanning: { cls: 'status-pending', label: 'status.scanning', icon: Loader2 },
  pending: { cls: 'status-pending', label: 'status.pending', icon: CircleDashed },
};

export function StatusBadge({ status, code, title }: { status: Status; code?: number; title?: string }) {
  const { tr } = useI18n();
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const Icon = style.icon;
  return (
    <span className={`status ${style.cls}`} title={title}>
      <Icon className={`h-3 w-3 ${status === 'scanning' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {tr(style.label)}
      {code ? <span className="opacity-75">{code}</span> : null}
    </span>
  );
}
