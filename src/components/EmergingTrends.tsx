import { TrendingUp, FileText, Search } from 'lucide-react';

export function EmergingTrends() {
  const trends = [
    { term: 'sso timeout', docCount: 42, bgCount: 150, score: 3.8, isRising: true },
    { term: 'pricing competitor-x', docCount: 28, bgCount: 50, score: 2.9, isRising: true },
    { term: 'export crash', docCount: 15, bgCount: 80, score: 1.5, isRising: false }
  ];

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            Emerging Trends Discovery
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Uncover "unknown unknown" churn drivers using Elasticsearch's Significant Terms aggregation across thousands of call transcripts and support tickets.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mt-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Statistically Significant Terms (Last 7 Days)
        </h4>
        
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-4 text-[10px] uppercase text-muted-foreground font-semibold px-2">
            <div className="col-span-5">Term / Phrase</div>
            <div className="col-span-2 text-center">Foreground Hits</div>
            <div className="col-span-2 text-center">Background Hits</div>
            <div className="col-span-3 text-right">Significance Score</div>
          </div>
          
          {trends.map((trend, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 items-center bg-background border border-border rounded-lg p-3 hover:border-orange-500/50 transition-colors cursor-not-allowed group">
              <div className="col-span-5 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-400 transition" />
                <span className="text-xs font-bold text-foreground group-hover:text-orange-400 transition">"{trend.term}"</span>
              </div>
              <div className="col-span-2 text-center text-xs font-mono">{trend.docCount}</div>
              <div className="col-span-2 text-center text-xs font-mono text-muted-foreground">{trend.bgCount}</div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <span className="text-xs font-mono font-bold text-orange-400">{trend.score.toFixed(2)}</span>
                {trend.isRising && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
