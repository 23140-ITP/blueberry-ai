import { Lock, UserCheck, ShieldAlert, FileText } from 'lucide-react';
import { useState } from 'react';

export function DlsSimulator() {
  const [role, setRole] = useState<'admin' | 'csm-na' | 'csm-eu'>('admin');

  const allAccounts = [
    { id: 'ACC-002', name: 'Acme Corp', region: 'North America', status: 'At Risk' },
    { id: 'ACC-005', name: 'Globex Inc', region: 'Europe', status: 'Healthy' },
    { id: 'ACC-012', name: 'Initech', region: 'North America', status: 'Warning' },
    { id: 'ACC-044', name: 'Soylent Corp', region: 'Europe', status: 'At Risk' }
  ];

  const visibleAccounts = allAccounts.filter(acc => {
    if (role === 'admin') return true;
    if (role === 'csm-na') return acc.region === 'North America';
    if (role === 'csm-eu') return acc.region === 'Europe';
    return false;
  });

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-400" />
            Document-Level Security (DLS) Simulator
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Test how Elasticsearch Role-Based Access Control filters query results at the document level based on the logged-in user's assigned region.
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border pb-6">
        <button
          onClick={() => setRole('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
            role === 'admin' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-card border-border text-muted-foreground hover:bg-card/50'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Global Admin
        </button>
        <button
          onClick={() => setRole('csm-na')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
            role === 'csm-na' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-card border-border text-muted-foreground hover:bg-card/50'
          }`}
        >
          <UserCheck className="h-4 w-4" /> CSM (North America)
        </button>
        <button
          onClick={() => setRole('csm-eu')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
            role === 'csm-eu' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-card border-border text-muted-foreground hover:bg-card/50'
          }`}
        >
          <UserCheck className="h-4 w-4" /> CSM (Europe)
        </button>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Visible Documents ({visibleAccounts.length} / {allAccounts.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAccounts.map((acc, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="text-xs font-bold text-foreground block">{acc.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{acc.id}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground uppercase">
                  {acc.region}
                </span>
                <span className={`text-[10px] font-bold ${
                  acc.status === 'At Risk' ? 'text-rose-400' :
                  acc.status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {acc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
