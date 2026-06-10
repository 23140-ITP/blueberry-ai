import { Lock, Search, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';

const MOCK_DATA = [
  { id: 'ACC-001', name: 'Quantum Health', region: 'North America', industry: 'Healthcare' },
  { id: 'ACC-002', name: 'Global Tech Inc', region: 'Europe', industry: 'Software' },
  { id: 'ACC-003', name: 'Nexus Corp', region: 'North America', industry: 'Finance' },
  { id: 'ACC-004', name: 'Stark Industries', region: 'Europe', industry: 'Manufacturing' },
  { id: 'ACC-005', name: 'Wayne Enterprises', region: 'North America', industry: 'Conglomerate' }
];

export function DlsSimulator() {
  const [role, setRole] = useState<'global' | 'na' | 'eu'>('global');
  const [querying, setQuerying] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const runQuery = () => {
    setQuerying(true);
    setResults(null);
    setTimeout(() => {
      const filtered = MOCK_DATA.filter(acc => {
        if (role === 'global') return true;
        if (role === 'na' && acc.region === 'North America') return true;
        if (role === 'eu' && acc.region === 'Europe') return true;
        return false;
      });
      setResults(filtered);
      setQuerying(false);
    }, 800);
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            Document-Level Security (DLS)
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Simulate how Elasticsearch Role-Based Access Control filters query results at the document level. 
            Users only see documents that match their assigned region privileges, even if they run a match_all query.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-xl">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Active User Role</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setRole('global')}
            className={`p-4 rounded-lg border cursor-pointer transition flex items-center gap-3 ${role === 'global' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-background hover:border-zinc-500'}`}
          >
            <ShieldCheck className={`h-5 w-5 ${role === 'global' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <div>
              <span className="block text-xs font-bold text-foreground">Global Admin</span>
              <span className="text-[10px] text-muted-foreground">Access all regions</span>
            </div>
          </div>
          <div 
            onClick={() => setRole('na')}
            className={`p-4 rounded-lg border cursor-pointer transition flex items-center gap-3 ${role === 'na' ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-background hover:border-zinc-500'}`}
          >
            <User className={`h-5 w-5 ${role === 'na' ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <div>
              <span className="block text-xs font-bold text-foreground">North America CSM</span>
              <span className="text-[10px] text-muted-foreground">Region: North America</span>
            </div>
          </div>
          <div 
            onClick={() => setRole('eu')}
            className={`p-4 rounded-lg border cursor-pointer transition flex items-center gap-3 ${role === 'eu' ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-background hover:border-zinc-500'}`}
          >
            <User className={`h-5 w-5 ${role === 'eu' ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <div>
              <span className="block text-xs font-bold text-foreground">Europe CSM</span>
              <span className="text-[10px] text-muted-foreground">Region: Europe</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button 
            onClick={runQuery}
            disabled={querying}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <Search className={`h-4 w-4 ${querying ? 'animate-spin' : ''}`} />
            {querying ? 'Executing Query...' : 'Run Query (Match All)'}
          </button>
          <div className="text-[10px] text-muted-foreground font-mono bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800">
            GET accounts/_search {"{ \"query\": { \"match_all\": {} } }"}
          </div>
        </div>
      </div>

      {results && (
        <div className="border border-border rounded-lg overflow-hidden animate-fade-in">
          <div className="bg-card px-4 py-3 border-b border-border flex justify-between items-center">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtered Results</h4>
            <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">Hits: {results.length}</span>
          </div>
          <div className="divide-y divide-border">
            {results.map((res, i) => (
              <div key={i} className="p-4 bg-background flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded bg-muted/20 border border-border flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{res.id.split('-')[1]}</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground block">{res.name}</span>
                    <span className="text-[11px] text-muted-foreground">{res.industry}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    res.region === 'North America' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {res.region}
                  </span>
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No documents matched the applied security filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
