import { Lock, Construction } from 'lucide-react';

export function DlsSimulator() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-12 flex flex-col items-center justify-center gap-4 animate-fade-in shadow-sm min-h-[400px]">
      <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 mb-2">
        <Construction className="h-8 w-8 text-amber-500" />
      </div>
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        Document-Level Security (DLS)
      </h3>
      <p className="text-sm text-muted-foreground max-w-lg text-center leading-relaxed">
        This feature is currently under construction. When ready, it will simulate how Elasticsearch Role-Based Access Control filters query results at the document level based on the user's assigned region.
      </p>
      
      <div className="mt-8 p-4 bg-card border border-border rounded-lg flex items-center gap-3 w-full max-w-md">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">
          <strong className="text-foreground">Coming Soon:</strong> Global Admins vs North America/Europe CSM access controls.
        </div>
      </div>
    </div>
  );
}
