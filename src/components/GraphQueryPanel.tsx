import { useMemo, useState } from 'react';
import { Braces, Download, Play, RotateCcw } from 'lucide-react';
import { GRAPH_QUERY_PRESETS, runGraphQuery } from '../graph/query';
import type { GraphQueryResult, HuntGraphEdge, HuntGraphNode } from '../graph/types';
import { graphToCypher } from '../graph/export';
import { useI18n } from '../utils/i18n';

interface GraphQueryPanelProps {
  nodes: HuntGraphNode[];
  edges: HuntGraphEdge[];
  onResult: (result: GraphQueryResult) => void;
}

export function GraphQueryPanel({ nodes, edges, onResult }: GraphQueryPanelProps) {
  const { language } = useI18n();
  const [query, setQuery] = useState('MATCH candidate=true AND similarity>=70');
  const [lastResult, setLastResult] = useState<GraphQueryResult | null>(null);

  const copy = useMemo(() => ({
    en: {
      title: 'Graph Query',
      subtitle: 'Read-only local graph hunting. Query the evidence graph without changing it.',
      placeholder: 'MATCH candidate=true AND similarity>=70',
      run: 'Run query',
      reset: 'Reset',
      syntax: 'Syntax',
      examples: 'MATCH type=PROFILE · EDGE relationship=SAME_DOMAIN · SHARED type=DOMAIN · PATH from=TARGET to=PROFILE',
      matched: 'matched',
      warning: 'Unsupported clauses are ignored and reported.',
      export: 'Export Cypher',
      presets: { similar: 'Similar usernames', 'shared-domains': 'Shared domains', profiles: 'Observed profiles', 'strong-edges': 'Strong edges', 'same-domain': 'Same domain', 'target-profiles': 'Target → profiles' },
    },
    pt: {
      title: 'Consulta no grafo',
      subtitle: 'Graph hunting local e somente leitura. Consulte o grafo de evidências sem alterá-lo.',
      placeholder: 'MATCH candidate=true AND similarity>=70',
      run: 'Executar consulta',
      reset: 'Limpar',
      syntax: 'Sintaxe',
      examples: 'MATCH type=PROFILE · EDGE relationship=SAME_DOMAIN · SHARED type=DOMAIN · PATH from=TARGET to=PROFILE',
      matched: 'correspondências',
      warning: 'Cláusulas não suportadas são ignoradas e reportadas.',
      export: 'Exportar Cypher',
      presets: { similar: 'Usernames similares', 'shared-domains': 'Domínios compartilhados', profiles: 'Perfis observados', 'strong-edges': 'Arestas fortes', 'same-domain': 'Mesmo domínio', 'target-profiles': 'Alvo → perfis' },
    },
    es: {
      title: 'Consulta del grafo',
      subtitle: 'Graph hunting local y de solo lectura. Consulta el grafo de evidencia sin modificarlo.',
      placeholder: 'MATCH candidate=true AND similarity>=70',
      run: 'Ejecutar consulta',
      reset: 'Limpiar',
      syntax: 'Sintaxis',
      examples: 'MATCH type=PROFILE · EDGE relationship=SAME_DOMAIN · SHARED type=DOMAIN · PATH from=TARGET to=PROFILE',
      matched: 'coincidencias',
      warning: 'Las cláusulas no soportadas se ignoran y se informan.',
      export: 'Exportar Cypher',
      presets: { similar: 'Usernames similares', 'shared-domains': 'Dominios compartidos', profiles: 'Perfiles observados', 'strong-edges': 'Aristas fuertes', 'same-domain': 'Mismo dominio', 'target-profiles': 'Objetivo → perfiles' },
    },
  })[language], [language]);

  const execute = (nextQuery = query) => {
    const result = runGraphQuery(nextQuery, nodes, edges);
    setQuery(nextQuery);
    setLastResult(result);
    onResult(result);
  };

  const reset = () => {
    setQuery('');
    const result = runGraphQuery('', nodes, edges);
    setLastResult(result);
    onResult(result);
  };

  const exportCypher = () => {
    const selectedNodeIds = new Set(lastResult?.query ? lastResult.matchedNodeIds : nodes.map((node) => node.id));
    const selectedEdgeIds = new Set(lastResult?.query ? lastResult.matchedEdgeIds : edges.map((edge) => edge.id));
    const selectedNodes = nodes.filter((node) => selectedNodeIds.has(node.id));
    const selectedEdges = edges.filter((edge) => selectedEdgeIds.has(edge.id));
    const payload = graphToCypher(selectedNodes, selectedEdges);
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mineiro-graph-${new Date().toISOString().replace(/[:.]/g, '-')}.cypher`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="rounded-[18px] border border-[#37332B] bg-[#221F1A] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#908B7D]">
            <Braces className="h-4 w-4" />
            {copy.title}
          </div>
          <p className="mt-2 text-sm text-[#908B7D]">{copy.subtitle}</p>
        </div>
        {lastResult && (
          <div className="rounded-lg border border-[#4A453A] px-3 py-2 font-mono text-xs text-[#D6D1C3]">
            {lastResult.summary}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') execute();
          }}
          placeholder={copy.placeholder}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-[#37332B] bg-[#1B1915] px-4 py-3 font-mono text-sm text-[#F3F0E8] outline-none focus:border-[#6F6A5E]"
        />
        <button
          type="button"
          onClick={() => execute()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6F6A5E] bg-[#27241E] px-4 py-3 text-sm font-medium text-white hover:bg-[#27241E]"
        >
          <Play className="h-4 w-4" />
          {copy.run}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#37332B] px-4 py-3 text-sm text-[#B9B4A6] hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          {copy.reset}
        </button>
        <button
          type="button"
          onClick={exportCypher}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#37332B] px-4 py-3 text-sm text-[#B9B4A6] hover:text-white"
        >
          <Download className="h-4 w-4" />
          {copy.export}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {GRAPH_QUERY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => execute(preset.query)}
            className="rounded-lg border border-[#37332B] px-3 py-1.5 text-xs text-[#908B7D] hover:border-[#6F6A5E] hover:text-white"
          >
            {copy.presets[preset.id]}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-[#37332B] pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{copy.syntax}</div>
        <div className="mt-2 break-words font-mono text-[11px] leading-relaxed text-[#908B7D]">{copy.examples}</div>
        {lastResult?.warnings?.length ? (
          <div className="mt-3 rounded-lg border border-[#4A453A] bg-[#221F1A] p-3 text-xs text-[#B9B4A6]">
            {copy.warning}
            <ul className="mt-2 list-disc pl-4">
              {lastResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
