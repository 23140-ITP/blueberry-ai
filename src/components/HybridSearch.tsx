import { useState } from 'react';
import { GitMerge, Search, Filter, SlidersHorizontal } from 'lucide-react';

export function HybridSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-purple-400" />
            Hybrid Search (Reciprocal Rank Fusion)
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Compare standard keyword search (BM25) against semantic search (kNN) and see how Reciprocal Rank Fusion (RRF) provides the optimal combined result set.
          </p>
        </div>
        <button className="p-2 bg-card border border-border rounded-lg text-muted-foreground cursor-not-allowed opacity-80">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'Customer wants to cancel due to missing features'"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
            Keyword (BM25) <span className="text-[10px] font-normal text-muted-foreground">Lexical</span>
          </h4>
          {query ? (
            <div className="flex flex-col gap-2 min-h-[120px]">
              <div className="p-2 border border-border rounded bg-background text-[11px] text-muted-foreground">
                <strong className="text-foreground">TKT-892</strong>: Canceling because of missing SSO features.
              </div>
              <div className="p-2 border border-border rounded bg-background text-[11px] text-muted-foreground">
                <strong className="text-foreground">TKT-104</strong>: Wants features.
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4 min-h-[120px] flex items-center justify-center border border-dashed border-border/50 rounded bg-background/50">
              Enter a query to see BM25 results.
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-4 bg-card/50">
          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
            Semantic (kNN) <span className="text-[10px] font-normal text-muted-foreground">Vector</span>
          </h4>
          {query ? (
            <div className="flex flex-col gap-2 min-h-[120px]">
              <div className="p-2 border border-border rounded bg-background text-[11px] text-muted-foreground">
                <strong className="text-foreground">TKT-441</strong>: Customer is churning as we lack functionality they need.
              </div>
              <div className="p-2 border border-border rounded bg-background text-[11px] text-muted-foreground">
                <strong className="text-foreground">TKT-892</strong>: Canceling because of missing SSO features.
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4 min-h-[120px] flex items-center justify-center border border-dashed border-border/50 rounded bg-background/50">
              Enter a query to see kNN results.
            </div>
          )}
        </div>

        <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500"></div>
          <h4 className="text-xs font-bold text-purple-400 mb-3 flex items-center justify-between">
            Hybrid (RRF) <span className="text-[10px] font-normal text-muted-foreground">Combined</span>
          </h4>
          {query ? (
            <div className="flex flex-col gap-2 min-h-[120px]">
              <div className="p-2 border border-purple-500/20 rounded bg-background text-[11px] text-foreground shadow-sm">
                <strong>TKT-892</strong>: Canceling because of missing SSO features. <span className="text-[9px] text-purple-400 ml-1">(Rank 1 + Rank 2 = Winner)</span>
              </div>
              <div className="p-2 border border-border rounded bg-background text-[11px] text-muted-foreground">
                <strong className="text-foreground">TKT-441</strong>: Customer is churning as we lack functionality they need.
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4 min-h-[120px] flex items-center justify-center border border-dashed border-purple-500/30 rounded bg-purple-950/10 text-purple-400/70">
              Enter a query to see optimal results.
            </div>
          )}
        </div>
      </div>

      {/* Under the Hood Card */}
      <div className="mt-4 p-4 bg-purple-950/20 border border-purple-900/30 rounded-xl flex flex-col md:flex-row gap-4 items-start">
        <div className="bg-purple-500/20 p-2 rounded-lg shrink-0 mt-1">
          <GitMerge className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1.5">Under the Hood: Reciprocal Rank Fusion</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            RRF is an algorithm provided natively by Elasticsearch. It allows us to combine the results of multiple search queries (in this case, BM25 keyword matching and kNN vector similarity) with different scoring scales. It ranks documents by evaluating their position across both result sets, ensuring the most mathematically relevant documents always rise to the top.
          </p>
        </div>
      </div>
    </div>
  );
}
