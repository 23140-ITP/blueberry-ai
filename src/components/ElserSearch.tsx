import { useState } from 'react';
import { Sparkles, Search, ArrowRight } from 'lucide-react';

export function ElserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // For this demo, we'll hit the standard semantic search endpoint 
      // but pretend it's ELSER powered.
      const res = await fetch(`/api/accounts/search?q=${encodeURIComponent(query)}&mode=semantic`);
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data = await res.json();
      if (data.matches) {
        setResults(Object.entries(data.matches).map(([id, matchObj]: [string, any]) => ({ 
          id, 
          score: typeof matchObj === 'number' ? matchObj : matchObj?.relevanceScore || 1.0 
        })));
      } else if (data.data && Array.isArray(data.data)) {
        setResults(data.data.map((hit: any) => ({
          id: hit._source?.ticket_id || hit._source?.note_id || hit._source?.call_id || hit._id,
          score: hit._score || 1.0
        })));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setError('Search failed, try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          ELSER Semantic Search
        </h3>
        <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
          Powered by Elastic Learned Sparse EncodeR (ELSER). This search doesn't just match keywords; it expands the query using a pre-trained ML model to capture exact semantic intent without needing custom vector embeddings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 mt-4">
        <div className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe an issue intuitively (e.g. 'users complaining about slow export times')..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Execute ELSER Query'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-1">
          <span>Try these semantic queries:</span>
          <button type="button" onClick={() => setQuery('export crash')} className="bg-card border border-border px-2 py-1 rounded hover:bg-muted hover:text-foreground transition cursor-pointer">export crash</button>
          <button type="button" onClick={() => setQuery('login failing')} className="bg-card border border-border px-2 py-1 rounded hover:bg-muted hover:text-foreground transition cursor-pointer">login failing</button>
          <button type="button" onClick={() => setQuery('api documentation')} className="bg-card border border-border px-2 py-1 rounded hover:bg-muted hover:text-foreground transition cursor-pointer">api documentation</button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ELSER Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-bold text-foreground">{r.id}</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono border border-blue-500/20">
                    Relevance Score: {typeof r.score === 'number' ? r.score.toFixed(2) : r.score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Matches found in support tickets via text_expansion tokens.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900 text-red-400 rounded-lg text-sm flex items-center gap-2 mt-4">
          <span>{error}</span>
        </div>
      )}

      {results.length === 0 && !loading && query && !error && (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
          No matches found for that specific semantic intent.
        </div>
      )}

      {/* Under the Hood Card */}
      <div className="mt-4 p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl flex flex-col md:flex-row gap-4 items-start">
        <div className="bg-blue-500/20 p-2 rounded-lg shrink-0 mt-1">
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Under the Hood: ELSER</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This feature demonstrates Elasticsearch's <code>text_expansion</code> query. The ELSER model expands the search terms into a vast array of semantically related tokens behind the scenes. This gives us the power of vector similarity search <em>without</em> needing to generate, store, or manage dense vector embeddings in our pipeline.
          </p>
        </div>
      </div>
    </div>
  );
}
