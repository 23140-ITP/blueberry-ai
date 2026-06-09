"use client";

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Brain, ShieldAlert, Activity, Play, Layers, BadgeAlert, 
  Send, Copy, AlertTriangle, CheckCircle2, Terminal, HelpCircle, FileText, Sparkles, Inbox, BrainCircuit, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';

interface TimelineItem {
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

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: accountId } = use(params);
  const router = useRouter();
  
  const [account, setAccount] = useState<any>(null);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent Memory Bank states
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('preference');
  const [addingMemory, setAddingMemory] = useState(false);

  // Dynamic Risk states
  const [dynamicRiskData, setDynamicRiskData] = useState<any>(null);
  
  // Selected ticket / Runbook matching
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [recommendedRunbook, setRecommendedRunbook] = useState<any>(null);
  const [loadingRunbook, setLoadingRunbook] = useState(false);

  // Escalation flow
  const [escalationData, setEscalationData] = useState<any>(null);
  const [escalating, setEscalating] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'agent', text: "Hello! I am your Blueberry Copilot. How can I help you manage this account's retention status today?", timestamp: '' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID and timestamp on mount to prevent SSR hydration mismatch
  useEffect(() => {
    setSessionId(`session-${Date.now()}`);
    setMessages(prev => [
      {
        ...prev[0],
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchRunbook = async (ticketId: string) => {
    setLoadingRunbook(true);
    setRecommendedRunbook(null);
    try {
      const res = await fetch(`/api/tools/recommend-runbook?ticketId=${ticketId}`);
      const data = await res.json();
      if (data.success && data.runbook) {
        setRecommendedRunbook(data.runbook);
      }
    } catch (err) {
      console.error('Failed to fetch runbook:', err);
    } finally {
      setLoadingRunbook(false);
    }
  };

  const handleTriggerEscalation = async () => {
    setEscalating(true);
    try {
      const res = await fetch('/api/tools/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (data.success) {
        setEscalationData(data);
        setShowEscalationModal(true);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to trigger escalation:', err);
    } finally {
      setEscalating(false);
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tools/account-context?accountId=${accountId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Customer account not found' : 'Failed to load account data');
      }
      
      const data = await res.json();
      setAccount(data.account);

      // Fetch all accounts for the switcher
      const allAccRes = await fetch('/api/accounts');
      if (allAccRes.ok) {
        const allAccData = await allAccRes.json();
        setAllAccounts(allAccData.accounts || []);
      }

      // Construct a unified, sorted timeline
      const unifiedTimeline: TimelineItem[] = [];

      // 1. Map Tickets
      if (data.tickets) {
        data.tickets.forEach((t: any) => {
          unifiedTimeline.push({
            id: t.ticket_id,
            type: 'ticket',
            date: t.created_at || new Date().toISOString(),
            title: `Support Ticket: ${t.subject}`,
            description: t.description,
            priority: t.priority,
            status: t.status
          });
        });
      }

      // 2. Map Health Notes
      if (data.healthNotes) {
        data.healthNotes.forEach((n: any) => {
          unifiedTimeline.push({
            id: n.note_id,
            type: 'note',
            date: n.created_at || new Date().toISOString(),
            title: `CSM Health Note by ${n.author || 'CSM'}`,
            description: n.note_text,
            sentiment: n.sentiment,
            author: n.author
          });
        });
      }

      // 3. Map Call Transcripts
      if (data.callTranscripts) {
        data.callTranscripts.forEach((c: any) => {
          unifiedTimeline.push({
            id: c.call_id,
            type: 'call',
            date: c.date || new Date().toISOString(),
            title: `Customer Call Summary`,
            description: c.summary,
            duration: c.duration_minutes
          });
        });
      }

      // Sort timeline items descending (newest first)
      unifiedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(unifiedTimeline);

      // 4. Fetch Agent Memories
      const memoryRes = await fetch(`/api/tools/agent-memory?accountId=${accountId}`);
      if (memoryRes.ok) {
        const memoryData = await memoryRes.json();
        if (memoryData.memories) {
          setMemories(memoryData.memories);
        }
      }

      // 5. Fetch Dynamic Risk Score Breakdown (ephemeral read-only, doesn't update Elasticsearch)
      const riskRes = await fetch(`/api/tools/dynamic-risk?accountId=${accountId}`);
      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setDynamicRiskData(riskData);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!newMemoryText.trim()) return;
    setAddingMemory(true);
    try {
      const res = await fetch('/api/tools/agent-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          content: newMemoryText,
          category: newMemoryCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(prev => [data.memory, ...prev]);
        setNewMemoryText('');
      }
    } catch (err) {
      console.error('Failed to save agent memory:', err);
    } finally {
      setAddingMemory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  // Send message to agent (Context Injection included)
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const timestampStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: timestampStr
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setSending(true);

    // Auto-inject account context prefix for Dialogflow CX query context
    const messageWithContext = `[Account: ${account?.company_name || accountId} (${accountId})] ${textToSend}`;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageWithContext,
          sessionId,
          accountId,
          companyName: account?.company_name
        })
      });

      const data = await res.json();
      
      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: data.response || "I received your message but could not generate a response.",
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);

      // If the agent updated any notes, reload timeline to show it instantly!
      if (textToSend.toLowerCase().includes('log') || textToSend.toLowerCase().includes('note') || textToSend.toLowerCase().includes('escalat')) {
        setTimeout(fetchData, 2000); 
      }

    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        sender: 'agent',
        text: "Error: Failed to communicate with Google Cloud Agent. Please verify your credentials and network settings.",
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // Helper styles for risk levels
  const riskScore = account ? Math.round(account.risk_score * 100) : 0;
  const isCritical = riskScore >= 75;
  const isWarning = riskScore >= 25 && riskScore < 75;
  const healthColor = isCritical ? '#f87171' : isWarning ? '#fbbf24' : '#34d399';

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-8 md:px-8 min-h-screen flex flex-col">
      {/* Navigation Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/" 
          className="cursor-pointer text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Retention Radar
        </Link>
        <Link 
          href="/?view=copilot" 
          className="cursor-pointer text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Brain className="h-3.5 w-3.5" />
          Open Blueberry Copilot
        </Link>
      </div>

      {loading ? (
        <div className="flex-grow flex justify-center items-center">
          <span className="text-xs text-muted-foreground animate-pulse">Loading customer account details...</span>
        </div>
      ) : error ? (
        <div className="bg-background border border-border rounded-xl p-12 text-center flex-grow flex flex-col justify-center items-center gap-3">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Account Data Error</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Link href="/">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-foreground rounded-md text-xs font-semibold cursor-pointer transition">Go Back</button>
          </Link>
        </div>
      ) : (
        /* Main Layout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details & Timeline */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Account Info Header */}
            <div className="bg-background border border-border rounded-xl p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg border-b border-l border-blue-500/20">
                Customer War Room
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <select 
                    value={accountId}
                    onChange={(e) => router.push(`/account/${e.target.value}`)}
                    className="text-xl font-bold text-foreground tracking-tight bg-transparent border-none appearance-none cursor-pointer focus:outline-none hover:bg-muted/50 rounded px-1 -ml-1 transition"
                  >
                    {allAccounts.length > 0 ? (
                      allAccounts.map((acc: any) => (
                        <option key={acc.account_id} value={acc.account_id} className="bg-background text-foreground text-sm">
                          {acc.company_name}
                        </option>
                      ))
                    ) : (
                      <option value={accountId} className="bg-background text-foreground">{account.company_name}</option>
                    )}
                  </select>
                  <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none -ml-1" />
                </div>
                <span className="text-xs text-muted-foreground block">
                  Account ID: <strong className="text-muted-foreground">{account.account_id}</strong> • Industry: {account.industry}
                </span>
                
                <div className="flex gap-8 mt-5">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Annual Recurring ARR</span>
                    <strong className="text-sm text-foreground font-mono">${account.arr.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Last Contact Date</span>
                    <strong className="text-xs text-foreground">
                      {new Date(account.last_contact_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={handleTriggerEscalation}
                  disabled={escalating || account?.status === 'Critical'}
                  className={`mt-5 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    account?.status === 'Critical' 
                      ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 cursor-default' 
                      : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-sm'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {escalating ? 'Escalating...' : account?.status === 'Critical' ? 'Account Escalated' : 'Trigger Escalation'}
                </button>
              </div>

              {/* Glowing circular health meter */}
              <div className="relative w-24 h-24 flex justify-center items-center self-start sm:self-auto">
                <svg width="90" height="90" viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3.2" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={healthColor} strokeWidth="3.2" 
                    strokeDasharray={`${riskScore} ${100 - riskScore}`} strokeDashoffset="0"
                    style={{ transition: 'stroke-dasharray 0.5s ease', transformOrigin: 'center' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold font-mono tracking-tight" style={{ color: healthColor }}>{riskScore}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Risk</span>
                </div>
              </div>
            </div>

            {/* Reasoned Risk Breakdown & Simulator */}
            <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-blue-450" />
                  <span>Reasoned Risk Breakdown</span>
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      await fetch(`/api/tools/dynamic-risk?accountId=${accountId}&save=true`);
                      await fetchData();
                    }}
                    className="text-[10px] bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                  >
                    Recalculate & Sync
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Status: <strong style={{ color: healthColor }}>{dynamicRiskData?.status || account?.status}</strong>
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {!dynamicRiskData || !dynamicRiskData.factors || dynamicRiskData.factors.length === 0 ? (
                  <span className="text-xs text-muted-foreground py-2">Baseline risk environment. No high-threat risk factors active.</span>
                ) : (
                  dynamicRiskData.factors.map((factor: any) => {
                    const isAdded = factor.riskAdded > 0;
                    const sign = isAdded ? '+' : '';
                    const colorClass = isAdded ? 'text-red-400' : 'text-emerald-400';
                    return (
                      <div key={factor.name} className="flex justify-between items-center text-xs pb-2.5 border-b border-border last:border-b-0 last:pb-0">
                        <div>
                          <strong className="text-foreground font-semibold">{factor.name}</strong>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{factor.value}</span>
                        </div>
                        <span className={`font-mono font-bold ${colorClass}`}>{sign}{factor.riskAdded}%</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* What-If Simulator */}
              {dynamicRiskData?.factors?.some((f: any) => f.name.includes('Ticket')) && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/20 rounded-lg flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-full mt-0.5">
                    <Activity className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Counterfactual Simulator</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If we apply the suggested runbook and resolve the open tickets today, risk drops from <strong className="text-foreground">{riskScore}%</strong> to <strong className="text-emerald-400 font-mono">{(riskScore - (dynamicRiskData.factors.find((f: any) => f.name.includes('Ticket'))?.riskAdded || 0)).toFixed(0)}%</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Support Runbook Recommender */}
            <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Runbook Resolver</span>
                </h2>
                {selectedTicketId && (
                  <button 
                    onClick={() => { setSelectedTicketId(null); setRecommendedRunbook(null); }}
                    className="text-[10px] text-blue-450 hover:text-blue-350 cursor-pointer font-bold transition"
                  >
                    Clear Match
                  </button>
                )}
              </div>
              
              {!selectedTicketId ? (
                <div className="py-4 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg leading-relaxed">
                  Click "🔍 Runbook" on any support ticket in the timeline to pull up the matching troubleshooting procedures.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {loadingRunbook ? (
                    <span className="text-xs text-muted-foreground animate-pulse">Finding runbook in knowledge base...</span>
                  ) : recommendedRunbook ? (
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Category: {recommendedRunbook.category}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">
                        {recommendedRunbook.title}
                      </h4>
                      <div className="p-3.5 rounded-lg bg-card/50 border border-border text-xs text-muted-foreground leading-relaxed white-space-pre-wrap font-mono">
                        {recommendedRunbook.content}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No runbook found matching this ticket's issues.</span>
                  )}
                </div>
              )}
            </div>

            {/* Agent Memory Bank */}
            <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-blue-450" />
                  <span>Agent Memory Bank</span>
                </h2>
                <span className="text-[10px] bg-blue-950/20 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded font-mono">
                  {memories.length} facts cached
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Long-term preferences and escalation triggers cached in the <code className="text-[10px] text-blue-400 bg-card px-1 py-0.5 rounded">agent_memory</code> index.
              </p>

              {/* Memory List */}
              {memories.length === 0 ? (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg bg-card/20">
                  <BrainCircuit className="h-8 w-8 mb-3 opacity-40 text-blue-400" />
                  <p className="max-w-[200px]">No memories cached for this account. Teach the agent via chat, or log a memory below!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {memories.map((mem) => (
                    <div key={mem.memory_id || mem.created_at} className="p-3 rounded-lg bg-card/40 border border-border flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold uppercase ${
                          mem.category === 'preference' ? 'text-amber-400' : 
                          mem.category === 'escalation' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {mem.category}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(mem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mem.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Memory Form */}
              <div className="flex gap-2 mt-2 border-t border-border pt-4">
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  className="p-2 text-xs rounded border border-border bg-background text-muted-foreground focus:outline-none"
                >
                  <option value="preference">Preference</option>
                  <option value="escalation">Escalation</option>
                  <option value="milestone">Milestone</option>
                </select>
                <input
                  type="text"
                  placeholder="Remember a new customer preference..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="flex-grow pl-3 pr-2 py-2 text-xs rounded-md border border-border bg-background text-foreground placeholder-zinc-650 focus:outline-none"
                />
                <button
                  onClick={handleSaveMemory}
                  disabled={addingMemory || !newMemoryText.trim()}
                  className="px-3 bg-blue-600 hover:bg-blue-700 text-foreground rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                >
                  {addingMemory ? 'Saving...' : 'Remember'}
                </button>
              </div>
            </div>

            {/* Timeline */}
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
          </div>

          {/* Right Column: Chat panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <div className="bg-background border border-border rounded-xl flex flex-col h-[580px] overflow-hidden shadow-sm">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Blueberry Copilot</h2>
                  <span className="text-[10px] text-muted-foreground">Connected to GCP Agent Builder</span>
                </div>
              </div>

              {/* Chat messages list */}
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3.5">
                {messages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div 
                      key={idx} 
                      className={`max-w-[85%] ${isUser ? 'self-end' : 'self-start'} animate-fade-in`}
                    >
                      <div className={`p-4 rounded-xl text-sm leading-relaxed prose prose-invert max-w-none ${
                        isUser 
                          ? 'bg-blue-600 text-foreground rounded-br-none prose-p:text-white prose-strong:text-white' 
                          : 'bg-card border border-border text-foreground rounded-bl-none prose-p:text-foreground prose-strong:text-foreground'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      <span className={`text-[9px] text-muted-foreground mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

                {sending && (
                  <div className="self-start flex flex-col gap-1.5">
                    <div className="p-2.5 rounded-lg bg-card border border-border flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-150"></span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">Calling tools...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Actions Panel (Contextually Updated) */}
              <div className="p-3 border-t border-border bg-background flex flex-col gap-2">
                <button 
                  onClick={() => handleSendMessage(`Act as the Supervisor Agent. Run a full account review on ${account?.company_name}. Call the supportResolutionAgent, churnInvestigatorAgent, and voiceOfCustomerAgent. Then, use the actionAgent to save a unified Executive Brief to memory.`)} 
                  disabled={sending}
                  className="w-full text-xs font-semibold py-2 rounded border border-blue-500 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Run Full Account Review
                </button>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleSendMessage(`Why is this account (${account?.company_name}) at risk?`)} 
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-border text-muted-foreground hover:text-foreground cursor-pointer transition flex-grow text-center"
                  >
                    ❓ Why at risk?
                  </button>
                  <button 
                    onClick={() => handleSendMessage(`Search for open support tickets in this account`)} 
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-border text-muted-foreground hover:text-foreground cursor-pointer transition flex-grow text-center"
                  >
                    🔍 Search tickets
                  </button>
                  <button 
                    onClick={() => handleSendMessage(`Log a new negative sentiment health note: 'Customer David is extremely frustrated about the data export timeouts and requested a competitor evaluation.'`)} 
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-border text-muted-foreground hover:text-foreground cursor-pointer transition flex-grow text-center"
                  >
                    ✍ Log CSM note
                  </button>
                </div>
              </div>

              {/* Chat Input form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="p-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  placeholder="Ask your copilot anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={sending}
                  className="flex-grow pl-3 pr-2 py-2 text-xs rounded-md border border-border bg-background text-foreground placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={sending || !inputValue.trim()}
                  className="px-3 bg-blue-600 hover:bg-blue-700 text-foreground rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal Overlay */}
      {showEscalationModal && escalationData && (
        <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-[999] backdrop-blur-md">
          <div className="bg-background border border-red-900/30 w-[90%] max-w-[800px] max-h-[85vh] overflow-y-auto p-6 md:p-8 rounded-xl flex flex-col gap-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Emergency Escalation Triggered</span>
              </h2>
              <button 
                onClick={() => setShowEscalationModal(false)}
                className="px-2.5 py-1 text-xs rounded border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              The account status has been updated to <strong className="text-red-400 font-bold">Critical (99% Risk)</strong> in Elasticsearch. An escalation milestone has been written to the agent memory bank.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Copyable Email Draft */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    Email Draft (Markdown)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(escalationData.emailDraft);
                      alert('Copied email to clipboard!');
                    }}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-foreground rounded text-[10px] font-bold cursor-pointer transition"
                  >
                    Copy Email
                  </button>
                </div>
                <textarea
                  readOnly
                  value={escalationData.emailDraft}
                  className="w-full h-64 p-3 bg-card/60 border border-border rounded-lg text-foreground font-mono text-[10px] leading-relaxed resize-none outline-none"
                />
              </div>

              {/* Slack Card Layout preview */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="h-3 w-3" />
                  Slack Layout (JSON Block Kit)
                </span>
                <textarea
                  readOnly
                  value={escalationData.slackCard}
                  className="w-full h-64 p-3 bg-card/80 border border-border rounded-lg text-emerald-450 font-mono text-[10px] leading-relaxed resize-none outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
