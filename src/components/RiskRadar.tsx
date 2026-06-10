import Link from 'next/link';
import { SearchX, Sparkles } from 'lucide-react';

interface RiskRadarProps {
  filteredAccounts: any[];
  loading: boolean;
  searchTerm: string;
  searchMode: string;
  semanticMatches: Record<string, any>;
}

export function RiskRadar({ filteredAccounts, loading, searchTerm, searchMode, semanticMatches }: RiskRadarProps) {
  const totalARR = filteredAccounts.reduce((sum, acc) => sum + acc.arr, 0);
  const criticalCount = filteredAccounts.filter(acc => acc.risk_score >= 0.75).length;
  const warningCount = filteredAccounts.filter(acc => acc.risk_score >= 0.25 && acc.risk_score < 0.75).length;
  const healthyCount = filteredAccounts.filter(acc => acc.risk_score < 0.25).length;
  
  const avgHealth = filteredAccounts.length 
    ? Math.round(100 - (filteredAccounts.reduce((sum, acc) => sum + acc.risk_score, 0) / filteredAccounts.length) * 100)
    : 100;

  const totalCount = filteredAccounts.length || 1;
  const criticalPct = (criticalCount / totalCount) * 100;
  const warningPct = (warningCount / totalCount) * 100;
  const healthyPct = (healthyCount / totalCount) * 100;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total ARR Managed</span>
          <span className="text-2xl font-bold text-foreground font-heading">${totalARR.toLocaleString()}</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            {filteredAccounts.length} active customer accounts
          </span>
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">At Risk Accounts</span>
          <span className="text-2xl font-bold text-foreground font-heading">
            {criticalCount} <span className="text-sm font-normal text-muted-foreground">critical</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {warningCount} accounts flagged in warning status
          </span>
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Health</span>
          <span className="text-2xl font-bold text-foreground font-heading">{avgHealth}%</span>
          <div className="w-full bg-card h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full ${
                avgHealth > 75 ? 'bg-emerald-500' : avgHealth > 45 ? 'bg-amber-500' : 'bg-red-500'
              }`} 
              style={{ width: `${avgHealth}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main radar panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Account list card */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>Account List</span>
            <span className="text-[10px] bg-card border border-border text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {filteredAccounts.length}
            </span>
          </h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-background/40 border border-border rounded-xl p-4.5 flex flex-col gap-3.5 h-[140px] animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted/60 rounded w-2/3"></div>
                    </div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-auto">
                    <div className="space-y-1 w-16">
                      <div className="h-2 bg-muted/60 rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="space-y-1 w-16 items-end flex flex-col">
                      <div className="h-2 bg-muted/60 rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="bg-background/40 border border-border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <SearchX className="h-10 w-10 mb-4 opacity-30" />
              <p>No accounts matching "{searchTerm}" found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccounts.map(acc => {
                const isCrit = acc.risk_score >= 0.75;
                const isWarn = acc.risk_score >= 0.25 && acc.risk_score < 0.75;
                const riskPct = Math.round(acc.risk_score * 100);

                return (
                  <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                    <div className="bg-background border border-border hover:border-border p-4.5 rounded-xl cursor-pointer transition flex flex-col gap-3.5 h-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-foreground hover:text-blue-400 transition">{acc.company_name}</h4>
                          <span className="text-[11px] text-muted-foreground">{acc.account_id} • {acc.industry}</span>
                        </div>
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          isCrit ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50' :
                          isWarn ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                        }`}>
                          {isCrit ? 'Critical' : isWarn ? 'At Risk' : 'Healthy'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-border/50 pt-2 text-xs mt-auto">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">ARR</span>
                          <strong className="text-foreground">${acc.arr.toLocaleString()}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground uppercase block">Risk Score</span>
                          <strong className={`font-mono ${
                            isCrit ? 'text-red-600 dark:text-red-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>{riskPct}%</strong>
                        </div>
                      </div>

                      {/* Semantic Match Reason Snippet */}
                      {searchMode !== 'client' && semanticMatches[acc.account_id] && (
                        <div className="mt-1 p-2.5 rounded bg-card/60 border border-border text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="h-3 w-3" />
                            {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)} Match ({semanticMatches[acc.account_id].relevanceScore}% Relevance)
                          </span>
                          <p dangerouslySetInnerHTML={{ __html: semanticMatches[acc.account_id].matchReason }} />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution chart panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Analytics</h3>
          <div className="bg-background border border-border rounded-xl p-6 shadow-sm flex flex-col items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-start mb-4">Portfolio Distribution</span>
            <div className="flex justify-center py-4">
              <svg width="120" height="120" viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                {filteredAccounts.length > 0 ? (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.2" 
                      strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.2" 
                      strokeDasharray={`${warningPct} ${100 - warningPct}`} strokeDashoffset={`-${criticalPct}`} />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" 
                      strokeDasharray={`${healthyPct} ${100 - healthyPct}`} strokeDashoffset={`-${criticalPct + warningPct}`} />
                  </>
                ) : (
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                )}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="w-full flex flex-col gap-2.5 mt-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Critical Risk (≥75%)
                </span>
                <strong className="text-foreground">{criticalCount}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  At Risk (25-74%)
                </span>
                <strong className="text-foreground">{warningCount}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Healthy (&lt;25%)
                </span>
                <strong className="text-foreground">{healthyCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
