import { Gauge, Activity, Clock, Cpu, Server } from 'lucide-react';

export function ApmDashboard() {
  const mockTraces = [
    { name: 'GET /api/accounts', duration: 145, status: 200, service: 'Next.js Frontend' },
    { name: 'POST /api/mcp (searchIssues)', duration: 842, status: 200, service: 'Node.js Backend' },
    { name: 'Elasticsearch Query (support_tickets)', duration: 65, status: 200, service: 'Elasticsearch' },
    { name: 'POST /api/mcp (escalateAccount)', duration: 1250, status: 200, service: 'Node.js Backend' },
    { name: 'Vertex AI Model Inference', duration: 1100, status: 200, service: 'GCP Agent Builder' },
  ];

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-400" />
            Elastic APM Tracing
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Monitor end-to-end distributed tracing across your Next.js application, Node.js API, Elasticsearch cluster, and Google Cloud services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">APM Agent Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Activity className="h-3.5 w-3.5" /> Trans Rate
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">14.2 <span className="text-sm text-muted-foreground font-sans">tpm</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Clock className="h-3.5 w-3.5" /> Avg Latency
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">420 <span className="text-sm text-muted-foreground font-sans">ms</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase">
            <Cpu className="h-3.5 w-3.5" /> Error Rate
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">0.02 <span className="text-sm font-sans">%</span></div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Recent Distributed Traces</h4>
        <div className="flex flex-col gap-2">
          {mockTraces.map((trace, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs font-bold text-foreground block">{trace.name}</span>
                  <span className="text-[10px] text-muted-foreground">{trace.service}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
                  {trace.status} OK
                </span>
                <span className={`text-xs font-mono font-bold ${trace.duration > 1000 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {trace.duration} ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
