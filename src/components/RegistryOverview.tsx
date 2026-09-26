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
    <section className="border border-[#2A2A2A] bg-[#0A0A0A] rounded-md">
      <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#F5F5F5] uppercase tracking-widest">
            Mineiro Registry
          </div>
          <div className="text-[10px] text-[#A3A3A3] mt-1">
            Detector inventory, reliability and provenance health.
          </div>
        </div>
        <span className="text-[9px] px-2 py-1 border border-[#737373] text-[#F5F5F5] uppercase">
          v1.3
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#2A2A2A]">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="bg-[#050505] p-4">
            <Icon className="w-4 h-4 text-[#FFFFFF] mb-3" />
            <div className="text-xl font-bold text-[#FFFFFF]">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#F5F5F5] mt-1">{label}</div>
            <div className="text-[10px] text-[#737373] mt-1">{detail}</div>
          </div>
        ))}
      </div>

      <div className="p-4 grid lg:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#A3A3A3] mb-2">
            Category Distribution
          </div>
          <div className="space-y-1.5">
            {stats.byCategory.slice(0, 8).map((item) => (
              <div key={item.key} className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-[10px]">
                <span className="text-[#F5F5F5] uppercase">{item.key}</span>
                <div className="h-1.5 bg-[#111111] border border-[#2A2A2A]">
                  <div className="h-full bg-[#FFFFFF]" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="text-right text-[#A3A3A3]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#A3A3A3] mb-2">
            Detector Reliability
          </div>
          <div className="space-y-2">
            {stats.byReliabilityTier.map((item) => (
              <div key={item.key} className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
                <div>
                  <div className="text-xs text-[#F5F5F5] uppercase">{item.key}</div>
                  <div className="text-[10px] text-[#737373]">{item.percent}% of registry</div>
                </div>
                <div className="text-lg font-bold text-[#FFFFFF]">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
