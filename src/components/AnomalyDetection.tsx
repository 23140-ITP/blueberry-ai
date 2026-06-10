import { TrendingDown, AlertTriangle, Bell, Activity, X, Settings, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function AnomalyDetection() {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
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
        <button 
          onClick={() => setIsAlertModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded text-xs font-semibold hover:text-foreground transition-colors cursor-not-allowed opacity-80"
        >
          <Settings className="h-3.5 w-3.5" /> Alert Settings
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{anom.metric}</span>
                    <span className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">{anom.account}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{anom.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-mono font-bold ${anom.score > 90 ? 'text-red-400' : anom.score > 80 ? 'text-amber-400' : 'text-blue-400'}`}>
                      Score: {anom.score}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{anom.time}</span>
                  </div>
                  <Link href={`/account/${anom.account}`}>
                    <span className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-not-allowed">
                      View Account <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Under the Hood Card */}
      <div className="mt-4 p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl flex flex-col md:flex-row gap-4 items-start">
        <div className="bg-amber-500/20 p-2 rounded-lg shrink-0 mt-1">
          <TrendingDown className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Under the Hood: Unsupervised ML</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This utilizes Elasticsearch's Machine Learning Anomaly Detection capabilities. We configure a continuous job to profile normal behavior across index time-series data (like ticket frequency). The ML models automatically identify anomalies and assign a normalized score (0-100) indicating the severity of the deviation.
          </p>
        </div>
      </div>

      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" /> Configure Alerts
              </h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Index Monitored</label>
                <select className="w-full bg-card border border-border rounded p-2 text-foreground focus:outline-none">
                  <option>health_notes (Sentiment Drop)</option>
                  <option>tickets (Volume Spike)</option>
                  <option>call_transcripts (Anger/Frustration)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Anomaly Score Threshold</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="50" max="100" defaultValue="80" className="w-full accent-amber-500" />
                  <span className="font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded">80</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Alert triggers when the anomaly score exceeds this value.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notification Channel</label>
                <select className="w-full bg-card border border-border rounded p-2 text-foreground focus:outline-none">
                  <option>Slack (#customer-alerts)</option>
                  <option>Email (csm-team@blueberry.ai)</option>
                  <option>PagerDuty</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
              <button onClick={() => setIsAlertModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={() => setIsAlertModalOpen(false)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded transition-colors cursor-pointer">
                Save Alert Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
