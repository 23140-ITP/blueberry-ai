import Link from 'next/link';
import { SearchX, Sparkles, Search, SlidersHorizontal, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useState } from 'react';

interface RiskRadarProps {
  filteredAccounts: any[];
  loading: boolean;
  searchTerm: string;
  searchMode: 'client' | 'keyword' | 'hybrid' | 'vector' | string;
  semanticMatches: Record<string, any>;
  setSearchTerm: (t: string) => void;
  setSearchMode: React.Dispatch<React.SetStateAction<any>>;
  setSemanticMatches: (m: Record<string, any>) => void;
}

const getRiskColor = (score: number) => {
  if (score >= 0.75) return '#ef4444'; // red-500
  if (score >= 0.25) return '#eab308'; // yellow-500
  return '#10b981'; // emerald-500
};

const getRiskBadgeStyle = (score: number) => {
  if (score >= 0.75) return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (score >= 0.25) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

export function RiskRadar({ 
  filteredAccounts, loading, searchTerm, searchMode, semanticMatches,
  setSearchTerm, setSearchMode, setSemanticMatches 
}: RiskRadarProps) {
  const [sortOrder, setSortOrder] = useState<'risk_desc' | 'risk_asc' | 'arr_desc' | 'relevance'>('risk_desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');

  // Apply local sorting and filtering FIRST
  const displayedAccounts = [...filteredAccounts]
    .filter(acc => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'critical') return acc.risk_score >= 0.75;
      if (statusFilter === 'warning') return acc.risk_score >= 0.25 && acc.risk_score < 0.75;
      if (statusFilter === 'healthy') return acc.risk_score < 0.25;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'risk_desc') return b.risk_score - a.risk_score;
      if (sortOrder === 'risk_asc') return a.risk_score - b.risk_score;
      if (sortOrder === 'arr_desc') return b.arr - a.arr;
      if (sortOrder === 'relevance' && searchMode !== 'client') {
        const scoreA = semanticMatches[a.account_id]?.relevanceScore || 0;
        const scoreB = semanticMatches[b.account_id]?.relevanceScore || 0;
        return scoreB - scoreA;
      }
      return 0;
    });

  const totalARR = displayedAccounts.reduce((sum, acc) => sum + acc.arr, 0);
  const criticalCount = displayedAccounts.filter(acc => acc.risk_score >= 0.75).length;
  const warningCount = displayedAccounts.filter(acc => acc.risk_score >= 0.25 && acc.risk_score < 0.75).length;
  const healthyCount = displayedAccounts.filter(acc => acc.risk_score < 0.25).length;
  
  const avgHealth = displayedAccounts.length 
    ? Math.round(100 - (displayedAccounts.reduce((sum, acc) => sum + acc.risk_score, 0) / displayedAccounts.length) * 100)
    : 100;

  const totalCount = displayedAccounts.length || 1;
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
            {displayedAccounts.length} active customer accounts
          </span>
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            AT RISK ACCOUNTS
            <Tooltip content="Accounts with a Risk Score > 75%" position="top">
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
            </Tooltip>
          </h3>
          <p className="text-3xl font-black text-red-400 font-mono mt-1">{criticalCount} <span className="text-sm font-semibold text-muted-foreground">critical</span></p>
          <span className="text-[11px] text-muted-foreground">
            {warningCount} accounts flagged in warning status
          </span>
        </div>

        <div className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            PORTFOLIO HEALTH
            <Tooltip content="% of accounts not at risk of churning." position="top">
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
            </Tooltip>
          </h3>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{Math.round(healthyPct)}%</p>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>Account List</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-mono border border-blue-500/20">
                {displayedAccounts.length}
              </span>
            </h3>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="inline-flex bg-background border border-border rounded-lg p-0.5">
                {(['client', 'keyword', 'vector', 'hybrid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSearchMode(mode);
                      setSearchTerm('');
                      setSemanticMatches({});
                      if (mode !== 'client') setSortOrder('relevance' as any);
                      else if (sortOrder === 'relevance') setSortOrder('risk_desc');
                    }}
                    className={`px-3 py-1 text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
                      searchMode === mode 
                        ? 'bg-muted text-foreground border border-zinc-700/50 shadow-sm rounded-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Tooltip 
                      content={
                        mode === 'client' ? 'Filter list locally on device' :
                        mode === 'keyword' ? 'Standard keyword matching' :
                        mode === 'vector' ? 'Smart conceptual search' :
                        'AI-Powered combination of keywords and concepts'
                      } 
                      position="top"
                    >
                      {mode === 'client' && 'Basic Search'}
                      {mode === 'keyword' && 'Standard Search'}
                      {mode === 'vector' && 'Smart Search'}
                      {mode === 'hybrid' && 'AI-Powered Search'}
                    </Tooltip>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-[200px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={
                    searchMode === 'client' ? "Filter list locally..." :
                    searchMode === 'keyword' ? "Elastic keyword search..." :
                    searchMode === 'vector' ? "Elastic semantic search..." : "Elastic hybrid search..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 text-xs rounded-md border border-border bg-background/80 text-foreground placeholder-zinc-650 focus:outline-none focus:border-zinc-750 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-card border border-border rounded-md p-1 px-2">
              <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as any)}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-foreground outline-none cursor-pointer [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="risk_desc">Sort: Highest Risk</option>
                <option value="risk_asc">Sort: Lowest Risk</option>
                <option value="arr_desc">Sort: Highest ARR</option>
                {searchMode !== 'client' && <option value="relevance">Sort: Relevance</option>}
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-card border border-border rounded-md p-1 px-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-foreground outline-none cursor-pointer [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="all">Status: All</option>
                <option value="critical">Critical Only</option>
                <option value="warning">At Risk Only</option>
                <option value="healthy">Healthy Only</option>
              </select>
            </div>
          </div>

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
          ) : displayedAccounts.length === 0 ? (
            <div className="bg-background/40 border border-border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <SearchX className="h-10 w-10 mb-4 opacity-30" />
              <p>No accounts match the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedAccounts.map(acc => {
                const isCrit = acc.risk_score >= 0.75;
                const isWarn = acc.risk_score >= 0.25 && acc.risk_score < 0.75;

                return (
                  <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                    <div className="bg-background border border-border hover:border-zinc-600 p-5 rounded-xl cursor-pointer transition flex flex-col gap-4 h-full shadow-sm hover:shadow-md relative hover:z-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-col flex">
                          <h4 className="text-base font-black text-foreground">{acc.company_name}</h4>
                          <span className="text-xs text-muted-foreground font-medium">{acc.account_id} • {acc.industry}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-black font-mono tracking-tight" style={{ color: getRiskColor(acc.risk_score) }}>
                              {Math.round(acc.risk_score * 100)}%
                            </span>
                            <Tooltip content="Risk Score indicates likelihood of churn. >75% = Critical." position="top">
                              <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                            </Tooltip>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-card/50 rounded-lg p-3 border border-border/50 mt-auto">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-0.5">ARR</span>
                          <strong className="text-sm text-foreground">${acc.arr.toLocaleString()}</strong>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block mb-1">Status</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isCrit ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50' :
                            isWarn ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' :
                            'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                          }`}>
                            {isCrit ? 'Critical' : isWarn ? 'At Risk' : 'Healthy'}
                          </span>
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
            <div className="flex justify-center py-4 relative">
              <svg width="140" height="140" viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                {displayedAccounts.length > 0 ? (
                  <>
                    {/* Background */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3.2" />
                    {/* Segments */}
                    {criticalPct > 0 && <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0" />}
                    {warningPct > 0 && <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${warningPct} ${100 - warningPct}`} strokeDashoffset={`-${criticalPct}`} />}
                    {healthyPct > 0 && <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${healthyPct} ${100 - healthyPct}`} strokeDashoffset={`-${criticalPct + warningPct}`} />}
                  </>
                ) : (
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                )}
              </svg>
              {/* Inner Circle Label overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{totalCount}</span>
                <span className="text-[9px] uppercase text-muted-foreground">Accounts</span>
              </div>
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
