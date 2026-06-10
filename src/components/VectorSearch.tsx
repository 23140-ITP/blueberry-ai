import { Hexagon, Search, ArrowRight, Wand2 } from 'lucide-react';
import { useState } from 'react';

export function VectorSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [vector, setVector] = useState<number[]>([]);

  const handleEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    // Simulate hitting Vertex AI or an embedding model
    setTimeout(() => {
      const mockVector = Array.from({ length: 10 }, () => parseFloat((Math.random() * 2 - 1).toFixed(4)));
      setVector(mockVector);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Hexagon className="h-4 w-4 text-indigo-400" />
            Vector Search (Custom Embeddings)
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Convert text queries into dense vector arrays using a custom embedding model (like GCP Vertex AI Gecko), and perform exact kNN vector similarity search in Elasticsearch.
          </p>
        </div>
      </div>

      <form onSubmit={handleEmbed} className="flex gap-3 mt-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a search concept..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
        >
          {loading ? 'Embedding...' : 'Generate Vector'} <Wand2 className="h-4 w-4" />
        </button>
      </form>

      {vector.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Generated Dense Vector Representation (Truncated)</h4>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-[10px] text-zinc-400 break-all leading-relaxed">
              [ {vector.join(', ')}, ... 758 more dimensions ]
            </div>
          </div>
          
          <div>
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Nearest Neighbor Matches (kNN)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm font-bold text-foreground">TKT-112</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/20">Cosine Sim: 0.942</span>
                </div>
                <p className="text-xs text-muted-foreground">Found via exact vector distance calculation.</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-sm font-bold text-foreground">TKT-084</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/20">Cosine Sim: 0.891</span>
                </div>
                <p className="text-xs text-muted-foreground">Found via exact vector distance calculation.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
