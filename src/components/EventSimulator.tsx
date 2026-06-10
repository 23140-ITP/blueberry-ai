import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import Link from 'next/link';

interface EventSimulatorProps {
  accounts: any[];
  onSimulateComplete: () => void;
}

export function EventSimulator({ accounts, onSimulateComplete }: EventSimulatorProps) {
  // Simulation form states
  const [simType, setSimType] = useState<'ticket' | 'note' | 'call'>('ticket');
  const [simAccountId, setSimAccountId] = useState('ACC-002');
  const [simSubject, setSimSubject] = useState('');
  const [simDesc, setSimDesc] = useState('');
  const [simPriority, setSimPriority] = useState('High');
  const [simNoteText, setSimNoteText] = useState('');
  const [simAuthor, setSimAuthor] = useState('Sarah (CSM)');
  const [simTranscript, setSimTranscript] = useState('');
  const [simSummary, setSimSummary] = useState('');
  const [simDuration, setSimDuration] = useState(15);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');
  const [lastSubmittedEvent, setLastSubmittedEvent] = useState<any>(null);

  const noteTextSummary = (text: string) => {
    if (text.length <= 40) return text;
    return text.slice(0, 40) + '...';
  };

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimMessage('');
    setLastSubmittedEvent(null);
    try {
      let body: any = { type: simType, accountId: simAccountId };
      if (simType === 'ticket') {
        body.subject = simSubject;
        body.description = simDesc;
        body.priority = simPriority;
      } else if (simType === 'note') {
        body.noteText = simNoteText;
        body.author = simAuthor;
      } else if (simType === 'call') {
        body.transcript = simTranscript;
        body.summary = simSummary;
        body.durationMinutes = simDuration;
      }

      const res = await fetch('/api/tools/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSimMessage(`Success: ${data.message}`);
        
        // Cache submission details for user confirmation banner
        setLastSubmittedEvent({
          type: simType === 'ticket' ? 'Ticket' : simType === 'note' ? 'CSM Note' : 'Call Transcript',
          accountId: simAccountId,
          companyName: data.companyName || simAccountId,
          subject: simType === 'ticket' ? simSubject : simType === 'note' ? noteTextSummary(simNoteText) : simSummary,
          newRiskScore: data.healthUpdate?.newRiskScore,
          newStatus: data.healthUpdate?.newStatus
        });

        // Clear input fields
        setSimSubject('');
        setSimDesc('');
        setSimNoteText('');
        setSimTranscript('');
        setSimSummary('');
        
        onSimulateComplete();
      } else {
        setSimMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSimMessage(`Error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleAutoFillDemoData = () => {
    if (simType === 'ticket') {
      setSimSubject('API Gateway timeout during peak traffic hours');
      setSimDesc('Our server integration is getting 504 Gateway Timeouts from the reporting endpoint. This is blocking our core nightly sync.');
      setSimPriority('Urgent');
      setSimAccountId('ACC-002');
    } else if (simType === 'note') {
      setSimNoteText('TechFlow VP David mentioned they are extremely frustrated with the recent report crashes and are actively scheduling a call with a competitor\'s sales team.');
      setSimAuthor('Sarah (CSM)');
      setSimAccountId('ACC-002');
    } else if (simType === 'call') {
      setSimTranscript('CSM: Hi team, we reviewed the rate limit issue.\nCustomer: We need it raised to 10k requests/min immediately. If this isn\'t approved today we\'ll have to look elsewhere.');
      setSimSummary('Urgent request for API quota increase. Threatening vendor review if delayed.');
      setSimDuration(20);
      setSimAccountId('ACC-002');
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in">
      <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <span>Event Simulator</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Log a new support ticket or customer note. This will update the account's risk score in real time.</p>
          </div>
          <button 
            type="button"
            onClick={handleAutoFillDemoData}
            className="text-[10px] bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded font-semibold uppercase transition cursor-pointer"
          >
            Auto-Fill Example
          </button>
        </div>

        <form onSubmit={handleSimulateEvent} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Target Customer Account</label>
              <select
                value={simAccountId}
                onChange={(e) => setSimAccountId(e.target.value)}
                className="w-full p-2.5 text-xs rounded border border-border bg-card/60 text-foreground focus:outline-none"
              >
                {accounts.map((acc: any) => (
                  <option key={acc.account_id} value={acc.account_id}>{acc.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Activity Category</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded border border-border bg-card/60 text-foreground focus:outline-none"
              >
                <option value="ticket">Customer Support Ticket</option>
                <option value="note">CSM Health Note</option>
                <option value="call">CSM Call Transcript</option>
              </select>
            </div>
          </div>

          {simType === 'ticket' && (
            <div className="flex flex-col gap-4 border-t border-border pt-4 animate-fade-in">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Ticket Subject</label>
                <input
                  type="text"
                  placeholder="e.g. SSO Login failures after maintenance release"
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Ticket Description</label>
                <textarea
                  placeholder="Provide error logs, customer complaints, or steps to reproduce..."
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Ticket Priority</label>
                <select
                  value={simPriority}
                  onChange={(e) => setSimPriority(e.target.value)}
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority (Triggers risk calculator)</option>
                </select>
              </div>
            </div>
          )}

          {simType === 'note' && (
            <div className="flex flex-col gap-4 border-t border-border pt-4 animate-fade-in">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Note Content</label>
                <textarea
                  placeholder="Log updates. Sentiment models flag negative feedback (e.g. 'unhappy', 'threaten to cancel')."
                  value={simNoteText}
                  onChange={(e) => setSimNoteText(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider font-semibold">Author</label>
                <input
                  type="text"
                  value={simAuthor}
                  onChange={(e) => setSimAuthor(e.target.value)}
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground focus:outline-none"
                />
              </div>
            </div>
          )}

          {simType === 'call' && (
            <div className="flex flex-col gap-4 border-t border-border pt-4 animate-fade-in">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Phone Transcript</label>
                <textarea
                  placeholder="Customer: The export timeout crashes..."
                  value={simTranscript}
                  onChange={(e) => setSimTranscript(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Key Takeaway Summary</label>
                <input
                  type="text"
                  placeholder="e.g. SSO export crashes frequently during reports."
                  value={simSummary}
                  onChange={(e) => setSimSummary(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1.5 font-bold tracking-wider">Duration (Minutes)</label>
                <input
                  type="number"
                  value={simDuration}
                  onChange={(e) => setSimDuration(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded border border-border bg-card/40 text-foreground focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={simulating}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-foreground rounded-md text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Saving...' : 'Log This Event'}
          </button>

          {/* Submission Confirmation Banner */}
          {simMessage && (
            <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 relative ${
              simMessage.startsWith('Success') 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' 
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40'
            }`}>
              <button 
                type="button" 
                onClick={() => setSimMessage('')}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="font-semibold text-xs pr-6">{simMessage}</span>
              {lastSubmittedEvent && (
                <div className="text-[11px] text-muted-foreground mt-1 border-t border-border/80 pt-2.5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span>Ingested Event:</span>
                    <strong className="text-foreground font-mono text-[10px] uppercase">{lastSubmittedEvent.type}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Target Account:</span>
                    <strong className="text-foreground">{lastSubmittedEvent.companyName} ({lastSubmittedEvent.accountId})</strong>
                  </div>
                  {lastSubmittedEvent.subject && (
                    <div className="flex justify-between items-center">
                      <span>Detail Summary:</span>
                      <strong className="text-zinc-250 truncate max-w-[70%]">{lastSubmittedEvent.subject}</strong>
                    </div>
                  )}
                  {lastSubmittedEvent.newRiskScore !== null && (
                    <div className="flex justify-between items-center">
                      <span>Recalculated Score:</span>
                      <strong className="text-blue-400 font-mono">
                        {Math.round(lastSubmittedEvent.newRiskScore * 100)}% ({lastSubmittedEvent.newStatus})
                      </strong>
                    </div>
                  )}
                  <Link href={`/account/${lastSubmittedEvent.accountId}`}>
                    <button type="button" className="w-full mt-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5">
                      Open Customer War Room
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
