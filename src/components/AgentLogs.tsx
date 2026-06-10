import { TerminalSquare, List, PlayCircle, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AgentLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Continuous Mock incoming log stream
    const possibleAgents = ['supportResolutionAgent', 'Elastic MCP', 'churnInvestigatorAgent', 'actionAgent', 'billingAgent', 'complianceAgent'];
    const possibleMessages = [
      'Invoked tool searchIssues with query: "SSO timeout".',
      'Executed ES|QL query on support_tickets index. Returned 3 hits.',
      'Analyzing hits to formulate response...',
      'High negative sentiment detected in recent ticket.',
      'Failed to escalate account. Missing CSM assignment ID.',
      'Checking billing records for invoice discrepancies.',
      'Found HIPAA compliance violation flag in audit logs.',
      'Processing user request for data export.',
      'Simulating What-If scenario: 10% churn increase.',
      'Drafting email response to customer via Gmail integration.'
    ];
    
    let interval: any;
    const streamLogs = () => {
      const now = new Date();
      const newLog = {
        time: now.toISOString().substring(11, 23),
        level: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'WARN' : 'ERROR') : (Math.random() > 0.5 ? 'INFO' : 'DEBUG'),
        agent: possibleAgents[Math.floor(Math.random() * possibleAgents.length)],
        message: possibleMessages[Math.floor(Math.random() * possibleMessages.length)]
      };
      
      setLogs(prev => {
        const next = [...prev, newLog];
        if (next.length > 100) return next.slice(next.length - 100);
        return next;
      });
      
      // Random delay between 500ms and 3000ms
      interval = setTimeout(streamLogs, 500 + Math.random() * 2500);
    };

    streamLogs();
    
    return () => clearTimeout(interval);
  }, []);

  return (
    <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm h-[80vh]">
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-green-400" />
            Agent Observability Console
          </h3>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            Stream live execution logs and thoughts from your GCP Agent Builder agents and the Elastic MCP Bridge directly into an Elastic observability index.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-xs font-mono">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          STREAMING
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex-grow overflow-hidden flex flex-col font-mono text-[11px]">
        <div className="flex gap-4 border-b border-zinc-800 pb-2 mb-2 text-zinc-500 uppercase font-bold tracking-wider text-[9px]">
          <span className="w-24">Timestamp</span>
          <span className="w-16">Level</span>
          <span className="w-40">Agent / Service</span>
          <span className="flex-grow">Message</span>
        </div>
        
        <div className="flex-col flex gap-1.5 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4 py-1 hover:bg-zinc-900/50 transition">
              <span className="w-24 text-zinc-500">{log.time}</span>
              <span className={`w-16 font-bold ${
                log.level === 'INFO' ? 'text-blue-400' :
                log.level === 'DEBUG' ? 'text-zinc-400' :
                log.level === 'WARN' ? 'text-amber-400' : 'text-red-400'
              }`}>{log.level}</span>
              <span className="w-40 text-purple-400">{log.agent}</span>
              <span className="flex-grow text-zinc-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && <span className="text-zinc-600 italic">Waiting for log stream...</span>}
        </div>
      </div>
    </div>
  );
}
