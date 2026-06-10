import { useState, useEffect } from 'react';
import { Database, Filter, RefreshCw, Terminal, Search } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function RawDataExplorer() {
  const [index, setIndex] = useState('tickets');
  const [accountId, setAccountId] = useState('ALL');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const accounts = [
    { id: 'ALL', name: 'All Accounts' },
    { id: 'ACC-001', name: 'Acme Corp' },
    { id: 'ACC-002', name: 'TechFlow' },
    { id: 'ACC-003', name: 'Global Industries' },
    { id: 'ACC-004', name: 'Zenith Media' },
    { id: 'ACC-005', name: 'Pinnacle Finance' },
    { id: 'ACC-006', name: 'Vertex Logistics' },
    { id: 'ACC-007', name: 'Quantum Health' },
    { id: 'ACC-008', name: 'Nexus Education' },
    { id: 'ACC-009', name: 'Horizon Energy' },
    { id: 'ACC-010', name: 'Alpha Tech' },
    { id: 'ACC-011', name: 'Omega Services' },
    { id: 'ACC-012', name: 'Delta Data' }
  ];

  const indices = [
    { id: 'tickets', name: 'Support Tickets' },
    { id: 'health_notes', name: 'CSM Health Notes' },
    { id: 'call_transcripts', name: 'Call Transcripts' },
    { id: 'agent_memory', name: 'Agent Memory Bank' },
    { id: 'accounts', name: 'Accounts Data' },
    { id: 'knowledge_base', name: 'Knowledge Base (Runbooks)' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data?index=${index}&account_id=${accountId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [index, accountId]);

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
      <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Raw Data Explorer</span>
              <Tooltip content="Explore the raw JSON documents stored in the Elasticsearch serverless instance." position="top">
                <span className="text-muted-foreground cursor-help hover:text-foreground text-xs ml-1">(?)</span>
              </Tooltip>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Direct view into the Elasticsearch indices powering the Blueberry AI features.</p>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-muted border border-border rounded text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3" /> Select Index
            </label>
            <select
              value={index}
              onChange={(e) => setIndex(e.target.value)}
              className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-blue-500"
            >
              {indices.map(idx => (
                <option key={idx.id} value={idx.id}>{idx.name} ({idx.id})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-blue-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} {acc.id !== 'ALL' && `(${acc.id})`}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-grow flex flex-col gap-1.5 mt-auto">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Search Content</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search JSON output..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0D1117] border border-border rounded-lg overflow-hidden relative min-h-[400px]">
          <div className="flex items-center gap-2 bg-[#161b22] border-b border-border px-4 py-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono text-muted-foreground">GET /{index}/_search?q={accountId === 'ALL' ? '*' : `account_id:${accountId}`}</span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">{filteredData.length} hits</span>
          </div>
          
          <div className="p-4 overflow-auto max-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-full py-12 text-muted-foreground text-sm font-mono animate-pulse">
                Executing query...
              </div>
            ) : filteredData.length > 0 ? (
              <pre className="text-[11px] font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-words">
                {JSON.stringify(filteredData, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full py-12 text-muted-foreground text-sm font-mono">
                No documents found for this query.
              </div>
            )}
          </div>
        </div>
        
        {/* Under the Hood Card */}
        <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex flex-col md:flex-row gap-4 items-start">
          <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0 mt-1">
            <Database className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Under the Hood: Elasticsearch Serverless</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This explorer connects directly to the Elastic Cloud Serverless environment using the Node.js client. It demonstrates the rich mock data injected into the <code>{index}</code> index, which serves as the foundation for the Vector Search, Pain-Point Clustering, and Google Cloud Agent Builder integrations.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
