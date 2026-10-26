import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Clock3, Database, GitCompareArrows, History, RefreshCw } from 'lucide-react';
import type { CaseCollectionSnapshot, MineiroCase } from '../cases/types';
import { diffCollections } from '../cases/diff';
import { collectionsForTarget } from '../cases/store';
import { useI18n } from '../utils/i18n';

interface CaseDiffPanelProps {
  caseFile: MineiroCase | null;
  currentTarget: string;
  onLoadSnapshot: (snapshot: CaseCollectionSnapshot) => void;
}

export function CaseDiffPanel({ caseFile, currentTarget, onLoadSnapshot }: CaseDiffPanelProps) {
  const { language } = useI18n();
  const copy = useMemo(() => ({
    en: {
      title: 'Case Graph & Diff Intelligence',
      empty: 'No persistent case is attached to this investigation yet.',
      case: 'Case',
      collections: 'collections',
      pivots: 'pivot investigations',
      compare: 'Compare snapshots',
      previous: 'Previous',
      current: 'Current',
      noDiff: 'Run the same target at least twice inside this case to unlock Diff Intelligence.',
      material: 'material changes',
      load: 'Load snapshot',
      changed: 'changed fields',
      note: 'Disappearance is a collection observation, not proof that an account was deleted.',
      graphMemory: 'Persistent graph memory',
      graphMemoryDesc: 'Collections and pivot investigations survive browser reloads through IndexedDB.',
    },
    pt: {
      title: 'Case Graph & Diff Intelligence',
      empty: 'Ainda não há um caso persistente associado a esta investigação.',
      case: 'Caso',
      collections: 'coletas',
      pivots: 'investigações por pivot',
      compare: 'Comparar snapshots',
      previous: 'Anterior',
      current: 'Atual',
      noDiff: 'Execute o mesmo alvo pelo menos duas vezes dentro deste caso para liberar o Diff Intelligence.',
      material: 'mudanças materiais',
      load: 'Carregar snapshot',
      changed: 'campos alterados',
      note: 'Desaparecimento é uma observação de coleta, não prova de que uma conta foi excluída.',
      graphMemory: 'Memória persistente do grafo',
      graphMemoryDesc: 'Coletas e pivôs sobrevivem a reloads do navegador via IndexedDB.',
    },
    es: {
      title: 'Case Graph & Diff Intelligence',
      empty: 'Todavía no hay un caso persistente asociado a esta investigación.',
      case: 'Caso',
      collections: 'recolecciones',
      pivots: 'investigaciones por pivot',
      compare: 'Comparar snapshots',
      previous: 'Anterior',
      current: 'Actual',
      noDiff: 'Ejecuta el mismo objetivo al menos dos veces dentro de este caso para habilitar Diff Intelligence.',
      material: 'cambios materiales',
      load: 'Cargar snapshot',
      changed: 'campos modificados',
      note: 'La desaparición es una observación de recolección, no prueba de que una cuenta haya sido eliminada.',
      graphMemory: 'Memoria persistente del grafo',
      graphMemoryDesc: 'Las recolecciones y pivotes sobreviven a recargas del navegador mediante IndexedDB.',
    },
  })[language], [language]);

  const targetCollections = useMemo(
    () => caseFile ? collectionsForTarget(caseFile, currentTarget) : [],
    [caseFile, currentTarget]
  );

  const defaultAfter = Math.max(0, targetCollections.length - 1);
  const defaultBefore = Math.max(0, defaultAfter - 1);
  const [beforeIndex, setBeforeIndex] = useState(defaultBefore);
  const [afterIndex, setAfterIndex] = useState(defaultAfter);

  useEffect(() => {
    const nextAfter = Math.max(0, targetCollections.length - 1);
    setAfterIndex(nextAfter);
    setBeforeIndex(Math.max(0, nextAfter - 1));
  }, [caseFile?.id, currentTarget, targetCollections.length]);

  const boundedBefore = Math.min(beforeIndex, Math.max(0, targetCollections.length - 1));
  const boundedAfter = Math.min(afterIndex, Math.max(0, targetCollections.length - 1));

  const report = useMemo(() => {
    if (targetCollections.length < 2) return null;
    const before = targetCollections[boundedBefore];
    const after = targetCollections[boundedAfter];
    if (!before || !after || before.id === after.id) return null;
    return diffCollections(before, after);
  }, [targetCollections, boundedBefore, boundedAfter]);

  if (!caseFile) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#37332B] bg-[#221F1A] p-8 text-center">
        <Database className="mx-auto h-6 w-6 text-[#6F6A5E]" />
        <div className="mt-3 text-sm text-[#A19C8E]">{copy.empty}</div>
      </div>
    );
  }

  const counts = report?.counts;

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-[#37332B] bg-[#1B1915] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#908B7D]">
              <History className="h-4 w-4" />
              {copy.title}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#F3F0E8]">
              {caseFile.name}
            </h2>
            <p className="mt-2 text-sm text-[#908B7D]">
              {copy.graphMemoryDesc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-[#4A453A] px-3 py-2 text-[#B9B4A6]">
              {caseFile.collections.length} {copy.collections}
            </span>
            <span className="rounded-lg border border-[#4A453A] px-3 py-2 text-[#B9B4A6]">
              {caseFile.pivotInvestigations.length} {copy.pivots}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{copy.case}</div>
            <div className="mt-2 break-all font-mono text-xs text-[#ECE8DD]">{caseFile.id}</div>
          </div>
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">Created</div>
            <div className="mt-2 text-sm text-[#ECE8DD]">{new Date(caseFile.createdAt).toLocaleString()}</div>
          </div>
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">Updated</div>
            <div className="mt-2 text-sm text-[#ECE8DD]">{new Date(caseFile.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-[#37332B] bg-[#1B1915] p-6">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#908B7D]">
          <GitCompareArrows className="h-4 w-4" />
          {copy.compare}
        </div>

        {targetCollections.length < 2 ? (
          <div className="mt-5 rounded-[16px] border border-dashed border-[#37332B] p-5 text-sm text-[#908B7D]">
            {copy.noDiff}
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
              <label className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{copy.previous}</span>
                <select
                  value={boundedBefore}
                  onChange={(event) => setBeforeIndex(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#37332B] bg-[#131210] px-3 py-2.5 text-sm text-[#ECE8DD]"
                >
                  {targetCollections.map((item, index) => (
                    <option key={item.id} value={index}>
                      {new Date(item.collectedAt).toLocaleString()} · {item.foundCount} found
                    </option>
                  ))}
                </select>
              </label>

              <ArrowDownUp className="mb-3 hidden h-4 w-4 text-[#6F6A5E] lg:block" />

              <label className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{copy.current}</span>
                <select
                  value={boundedAfter}
                  onChange={(event) => setAfterIndex(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#37332B] bg-[#131210] px-3 py-2.5 text-sm text-[#ECE8DD]"
                >
                  {targetCollections.map((item, index) => (
                    <option key={item.id} value={index}>
                      {new Date(item.collectedAt).toLocaleString()} · {item.foundCount} found
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {report ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {(['NEW','DISAPPEARED','CHANGED','CONFIDENCE_UP','CONFIDENCE_DOWN','UNCHANGED'] as const).map((type) => (
                    <div key={type} className="rounded-[14px] border border-[#37332B] p-3">
                      <div className="font-mono text-[9px] tracking-[0.1em] text-[#908B7D]">{type}</div>
                      <div className="mt-1 text-xl font-semibold text-[#ECE8DD]">{counts?.[type] || 0}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[14px] border border-[#4A453A] bg-[#131210] px-4 py-3 text-sm text-[#B9B4A6]">
                  <strong className="text-white">{report.materialChanges}</strong> {copy.material}. {copy.note}
                </div>

                <div className="mt-5 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                  {report.entries
                    .filter((entry) => entry.changeType !== 'UNCHANGED')
                    .map((entry) => (
                      <article key={entry.id} className="rounded-[14px] border border-[#37332B] bg-[#221F1A] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#908B7D]">
                              {entry.changeType}
                            </div>
                            <div className="mt-1 text-sm font-medium text-[#F3F0E8]">{entry.platformName}</div>
                          </div>
                          <div className="text-xs text-[#908B7D]">
                            {entry.beforeStatus || '∅'} → {entry.afterStatus || '∅'}
                          </div>
                        </div>
                        {entry.changedFields.length > 0 && (
                          <div className="mt-2 text-xs text-[#908B7D]">
                            {copy.changed}: {entry.changedFields.join(', ')}
                          </div>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-[#908B7D]">{entry.note}</p>
                      </article>
                    ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadSnapshot(targetCollections[boundedBefore])}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#37332B] px-3 py-2 text-xs text-[#B9B4A6] hover:text-white"
                  >
                    <Clock3 className="h-3.5 w-3.5" />
                    {copy.load} · {copy.previous}
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadSnapshot(targetCollections[boundedAfter])}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#37332B] px-3 py-2 text-xs text-[#B9B4A6] hover:text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {copy.load} · {copy.current}
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
