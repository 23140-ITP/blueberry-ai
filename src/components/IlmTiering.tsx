import { Database, ThermometerSun, Snowflake, ArrowRight } from 'lucide-react';

export function IlmTiering() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-400" />
            Index Lifecycle Management (ILM)
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Automate data tiering to reduce Elasticsearch infrastructure costs. Active support tickets stay in the Hot tier, while closed tickets gradually move to Warm and Cold storage.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* HOT TIER */}
        <div className="flex-1 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-xl p-5 relative overflow-hidden group">
          <ThermometerSun className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-500/10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Hot Tier</h4>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">SSD Storage</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="text-2xl font-mono font-bold text-foreground">42 GB</div>
            <p className="text-[11px] text-muted-foreground">Active indices: <span className="text-foreground">support_tickets_write</span></p>
            <p className="text-[11px] text-muted-foreground">Policy: Rollover at 50GB or 30 days.</p>
          </div>
        </div>

        <div className="flex items-center justify-center text-muted-foreground">
          <ArrowRight className="h-5 w-5 hidden md:block" />
        </div>

        {/* WARM TIER */}
        <div className="flex-1 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-5 relative overflow-hidden group">
          <Database className="absolute -right-4 -bottom-4 h-24 w-24 text-amber-500/10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Warm Tier</h4>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">HDD Storage</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="text-2xl font-mono font-bold text-foreground">185 GB</div>
            <p className="text-[11px] text-muted-foreground">Read-only indices (1-3 months old).</p>
            <p className="text-[11px] text-muted-foreground">Policy: Shrink and force-merge.</p>
          </div>
        </div>

        <div className="flex items-center justify-center text-muted-foreground">
          <ArrowRight className="h-5 w-5 hidden md:block" />
        </div>

        {/* COLD TIER */}
        <div className="flex-1 bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20 rounded-xl p-5 relative overflow-hidden group">
          <Snowflake className="absolute -right-4 -bottom-4 h-24 w-24 text-sky-500/10 group-hover:scale-110 transition-transform" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Cold Tier</h4>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">Object Storage</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="text-2xl font-mono font-bold text-foreground">840 GB</div>
            <p className="text-[11px] text-muted-foreground">Searchable snapshots (&gt;3 months old).</p>
            <p className="text-[11px] text-muted-foreground">Policy: Move to cold after 90 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
