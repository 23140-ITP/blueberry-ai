import { Play, Layers, BadgeAlert, HelpCircle, Inbox } from 'lucide-react';

export interface TimelineItem {
  id: string;
  type: 'ticket' | 'note' | 'call';
  date: string;
  title: string;
  description: string;
  sentiment?: string;
  priority?: string;
  status?: string;
  author?: string;
  duration?: number;
}

interface AccountTimelineProps {
  timeline: TimelineItem[];
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  fetchRunbook: (id: string) => void;
}

export function AccountTimeline({ timeline, selectedTicketId, setSelectedTicketId, fetchRunbook }: AccountTimelineProps) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer Journey Timeline</h2>
      
      {timeline.length === 0 ? (
        <div className="bg-background border border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
          <Inbox className="h-10 w-10 mb-4 opacity-30" />
          <p>No activity logs registered for this account.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l border-border/80 ml-3 flex flex-col gap-6">
          {timeline.map((item) => {
            let typeColor = 'text-blue-400';
            let typeIcon = <Play className="h-3.5 w-3.5" />;
            if (item.type === 'ticket') {
              typeColor = item.priority === 'Urgent' ? 'text-red-400' : item.priority === 'High' ? 'text-amber-400' : 'text-blue-400';
              typeIcon = <BadgeAlert className="h-3.5 w-3.5" />;
            } else if (item.type === 'note') {
              typeColor = item.sentiment === 'Negative' ? 'text-red-400' : item.sentiment === 'Positive' ? 'text-emerald-400' : 'text-amber-400';
              typeIcon = <Layers className="h-3.5 w-3.5" />;
            }

            return (
              <div key={item.id} className="bg-background border border-border p-4.5 rounded-xl relative flex flex-col gap-2.5 animate-fade-in">
                {/* Circle node on line */}
                <div className={`absolute -left-[2.15rem] top-4.5 w-3.5 h-3.5 rounded-full bg-background border-2 flex items-center justify-center`} style={{ borderColor: 'currentColor', color: typeColor === 'text-red-400' ? '#ef4444' : typeColor === 'text-amber-400' ? '#f59e0b' : typeColor === 'text-emerald-400' ? '#10b981' : '#3b82f6' }}></div>

                {/* Timeline Card Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span style={{ color: typeColor === 'text-red-400' ? '#ef4444' : typeColor === 'text-amber-400' ? '#f59e0b' : typeColor === 'text-emerald-400' ? '#10b981' : '#3b82f6' }}>{typeIcon}</span>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  
                  {/* Badges depending on item type */}
                  {item.type === 'ticket' && (
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        item.priority === 'Urgent' ? 'bg-red-950/30 text-red-400 border border-red-900/40' : 'bg-card border border-border text-muted-foreground'
                      }`}>
                        {item.priority} Priority
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTicketId(item.id);
                          fetchRunbook(item.id);
                        }}
                        className={`padding-2 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer border flex items-center gap-1 transition ${
                          selectedTicketId === item.id 
                            ? 'bg-blue-950/20 text-blue-400 border-blue-900/40' 
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <HelpCircle className="h-3 w-3" />
                        Runbook
                      </button>
                    </div>
                  )}
                  {item.type === 'note' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.sentiment === 'Negative' ? 'bg-red-950/30 text-red-400 border border-red-900/40' :
                      item.sentiment === 'Positive' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40' :
                      'bg-amber-950/30 text-amber-400 border border-amber-900/40'
                    }`}>
                      {item.sentiment} Sentiment
                    </span>
                  )}
                  {item.type === 'call' && (
                    <span className="text-[10px] text-muted-foreground font-mono bg-card px-1.5 py-0.5 rounded">
                      ⏱ {item.duration} mins
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <p className="text-xs text-muted-foreground leading-relaxed white-space-pre-line">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
