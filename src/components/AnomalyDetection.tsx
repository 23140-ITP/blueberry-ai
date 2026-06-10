import { TrendingDown, AlertTriangle, Bell, Activity } from 'lucide-react';

export function AnomalyDetection() {
  const anomalies = [
    { time: '10 mins ago', account: 'ACC-002', metric: 'Negative Sentiment', score: 98, description: 'Unexpected spike in negative keywords in health notes.' },
    { time: '2 hours ago', account: 'ACC-005', metric: 'Ticket Volume', score: 85, description: 'Support ticket creation rate 3x higher than 30-day baseline.' },
    { time: 'Yesterday', account: 'ACC-012', metric: 'API Errors', score: 72, description: 'Slight deviation in API error rates reported by customer.' }
  ];

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-500" />
            Automated Anomaly Detection
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Machine Learning jobs running in Elastic continuously monitor support tickets and sentiment indices to detect abnormal customer behavior before churn occurs.
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded text-xs font-semibold hover:text-foreground transition-colors cursor-pointer">
          <Bell className="h-3.5 w-3.5" /> Configure Alerts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase mb-2">
            <Activity className="h-4 w-4" /> Active ML Jobs
          </div>
          <div className="text-3xl font-mono font-bold text-foreground mb-1">3</div>
          <p className="text-[10px] text-muted-foreground">Jobs running on support_tickets and health_notes indices.</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase mb-2">
            <AlertTriangle className="h-4 w-4" /> Critical Anomalies
          </div>
          <div className="text-3xl font-mono font-bold text-foreground mb-1">1</div>
          <p className="text-[10px] text-muted-foreground">Anomaly score &gt; 90 detected in the last 24 hours.</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Recent Anomaly Events</h4>
        <div className="flex flex-col gap-3">
          {anomalies.map((anom, i) => (
            <div key={i} className="flex flex-col gap-2 p-4 bg-card border border-border rounded-lg relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${anom.score > 90 ? 'bg-red-500' : anom.score > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{anom.metric}</span>
                  <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">{anom.account}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-mono font-bold ${anom.score > 90 ? 'text-red-400' : anom.score > 80 ? 'text-amber-400' : 'text-blue-400'}`}>
                    Score: {anom.score}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{anom.time}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{anom.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
