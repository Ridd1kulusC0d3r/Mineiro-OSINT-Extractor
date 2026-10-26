import { useMemo } from 'react';
import { Database, Gauge, Layers, ShieldCheck } from 'lucide-react';
import { getRegistryStats } from '../registry/registry';

export function RegistryOverview() {
  const stats = useMemo(() => getRegistryStats(), []);

  const cards = [
    {
      label: 'Registry Detectors',
      value: stats.totalDetectors.toLocaleString(),
      detail: 'versioned endpoint definitions',
      icon: Database,
    },
    {
      label: 'Logical Checks',
      value: stats.logicalEvidenceChecks.toLocaleString(),
      detail: `${stats.evidenceChecksPerDetector} evidence signals / detector`,
      icon: Layers,
    },
    {
      label: 'Avg Reliability',
      value: `${stats.averageReliability}/100`,
      detail: 'heuristic detector reliability',
      icon: Gauge,
    },
    {
      label: 'Verified Provenance',
      value: stats.verifiedDetectors.toLocaleString(),
      detail: `${stats.auditRequiredDetectors.toLocaleString()} pending audit`,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="border border-[#37332B] bg-[#1B1915] rounded-md">
      <div className="px-4 py-3 border-b border-[#37332B] flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#ECE8DD] uppercase tracking-widest">
            Mineiro Registry
          </div>
          <div className="text-[10px] text-[#B9B4A6] mt-1">
            Detector inventory, reliability and provenance health.
          </div>
        </div>
        <span className="text-[9px] px-2 py-1 border border-[#908B7D] text-[#ECE8DD] uppercase">
          v1.3
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#37332B]">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="bg-[#131210] p-4">
            <Icon className="w-4 h-4 text-[#ECE8DD] mb-3" />
            <div className="text-xl font-bold text-[#ECE8DD]">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#ECE8DD] mt-1">{label}</div>
            <div className="text-[10px] text-[#908B7D] mt-1">{detail}</div>
          </div>
        ))}
      </div>

      <div className="p-4 grid lg:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#B9B4A6] mb-2">
            Category Distribution
          </div>
          <div className="space-y-1.5">
            {stats.byCategory.slice(0, 8).map((item) => (
              <div key={item.key} className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-[10px]">
                <span className="text-[#ECE8DD] uppercase">{item.key}</span>
                <div className="h-1.5 bg-[#221F1A] border border-[#37332B]">
                  <div className="h-full bg-[#F0885A]" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="text-right text-[#B9B4A6]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#B9B4A6] mb-2">
            Detector Reliability
          </div>
          <div className="space-y-2">
            {stats.byReliabilityTier.map((item) => (
              <div key={item.key} className="flex items-center justify-between border-b border-[#37332B] pb-2">
                <div>
                  <div className="text-xs text-[#ECE8DD] uppercase">{item.key}</div>
                  <div className="text-[10px] text-[#908B7D]">{item.percent}% of registry</div>
                </div>
                <div className="text-lg font-bold text-[#ECE8DD]">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
