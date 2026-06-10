import { Globe, Server, Database, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

export function CrossCluster() {
  const [querying, setQuerying] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const runQuery = () => {
    setQuerying(true);
    setTimeout(() => {
      setResults([
        { id: 'TKT-991', cluster: 'na-cluster', region: 'us-east-1', text: 'Login failure on NA servers.' },
        { id: 'TKT-992', cluster: 'eu-cluster', region: 'eu-central-1', text: 'GDPR data export request timeout.' }
      ]);
      setQuerying(false);
    }, 1200);
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-400" />
            Cross-Cluster Search (CCS)
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Execute federated searches across geographically distributed Elasticsearch clusters (e.g., North America and Europe) with a single query, maintaining strict data sovereignty.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-center p-6 bg-card border border-border rounded-xl mt-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
            <Server className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-bold text-foreground">NA Cluster</span>
            <span className="text-[10px] text-muted-foreground font-mono">us-east-1</span>
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center">
          <button 
            onClick={runQuery}
            disabled={querying}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeftRight className={`h-4 w-4 ${querying ? 'animate-spin' : ''}`} />
            {querying ? 'Federating...' : 'Run Cross-Cluster Query'}
          </button>
          <div className="text-[10px] text-muted-foreground font-mono mt-2">
            GET *:support_tickets/_search
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
            <Server className="h-8 w-8 text-amber-400" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-bold text-foreground">EU Cluster</span>
            <span className="text-[10px] text-muted-foreground font-mono">eu-central-1</span>
          </div>
        </div>
      </div>

      {results && (
        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <div className="bg-card px-4 py-2 border-b border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Federated Results</h4>
          </div>
          <div className="divide-y divide-border">
            {results.map((res, i) => (
              <div key={i} className="p-4 bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{res.id}</span>
                    <span className="text-[11px] text-muted-foreground">{res.text}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    res.cluster === 'na-cluster' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {res.cluster}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1">{res.region}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
