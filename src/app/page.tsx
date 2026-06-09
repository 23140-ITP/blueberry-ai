"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, LayoutDashboard, Brain, Activity, ShieldAlert, CheckCircle2, 
  AlertTriangle, ArrowRight, Terminal, Send, Play, RefreshCw, Layers, Sparkles
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface Account {
  account_id: string;
  company_name: string;
  industry: string;
  arr: number;
  risk_score: number;
  status: string;
  last_contact_date: string;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'agent', text: "Hello! I am your Blueberry Copilot. Ask me anything about your customer accounts, recent calls, or churn risks.", timestamp: '' }
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setSending(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          sessionId
        })
      });

      const data = await res.json();
      
      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: data.response || "I received your message but could not generate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        sender: 'agent',
        text: "Error: Failed to communicate with Google Cloud Agent. Please verify your credentials and network settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const [searchMode, setSearchMode] = useState<'client' | 'keyword' | 'vector' | 'hybrid'>('client');
  const [activeTab, setActiveTab] = useState<'radar' | 'mcp'>('radar');
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [selectedMcpTool, setSelectedMcpTool] = useState<any>(null);
  const [mcpArgs, setMcpArgs] = useState<string>('{}');
  const [mcpResult, setMcpResult] = useState<string>('');
  const [mcpRunning, setMcpRunning] = useState<boolean>(false);
  const [semanticMatches, setSemanticMatches] = useState<Record<string, { relevanceScore: number; matchReason: string; matchType: string }>>({});
  const [aggregations, setAggregations] = useState<any[]>([]);

  // Pain points clustering state
  const [painPoints, setPainPoints] = useState<any[]>([]);

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

  const fetchPainPoints = async () => {
    try {
      const res = await fetch('/api/tools/pain-points');
      const data = await res.json();
      if (data.clusters) {
        setPainPoints(data.clusters);
      }
    } catch (err) {
      console.error('Failed to fetch pain points:', err);
    }
  };

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimMessage('');
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
        setSimSubject('');
        setSimDesc('');
        setSimNoteText('');
        setSimTranscript('');
        setSimSummary('');
        
        // Reload all data
        const resAcc = await fetch('/api/accounts');
        const dataAcc = await resAcc.json();
        if (dataAcc.accounts) {
          setAccounts(dataAcc.accounts);
        }
        if (dataAcc.aggregations) {
          setAggregations(dataAcc.aggregations);
        }
        fetchPainPoints();
      } else {
        setSimMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSimMessage(`Error: ${err.message}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setSimMessage(''), 5000);
    }
  };

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
        }
        if (data.aggregations) {
          setAggregations(data.aggregations);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
    fetchPainPoints();
  }, []);

  useEffect(() => {
    async function fetchMcpTools() {
      try {
        const res = await fetch('/api/mcp');
        const data = await res.json();
        if (data.tools) {
          setMcpTools(data.tools);
          setSelectedMcpTool(data.tools[0]);
          setMcpArgs(JSON.stringify({ accountId: 'ACC-002' }, null, 2));
        }
      } catch (err) {
        console.error('Failed to fetch MCP tools:', err);
      }
    }
    fetchMcpTools();
  }, []);

  const runMcpTool = async () => {
    if (!selectedMcpTool) return;
    setMcpRunning(true);
    setMcpResult('');
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(mcpArgs);
      } catch (e) {
        setMcpResult(`Error: Invalid arguments JSON: ${(e as Error).message}`);
        setMcpRunning(false);
        return;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: selectedMcpTool.name,
            arguments: parsedArgs
          }
        })
      });
      const data = await res.json();
      setMcpResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setMcpResult(`Error running tool: ${(err as Error).message}`);
    } finally {
      setMcpRunning(false);
    }
  };

  useEffect(() => {
    if (searchMode === 'client' || !searchTerm.trim()) {
      setSemanticMatches({});
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/accounts/search?q=${encodeURIComponent(searchTerm)}&mode=${searchMode}`);
        const data = await res.json();
        if (data.matches) {
          setSemanticMatches(data.matches);
        }
      } catch (err) {
        console.error('Failed to run semantic search:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchMode]);

  const filteredAccounts = accounts.filter(acc => {
    if (searchMode !== 'client' && searchTerm.trim() !== '') {
      return !!semanticMatches[acc.account_id];
    }
    return (
      acc.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Compute KPI metrics dynamically
  const totalARR = accounts.reduce((sum, acc) => sum + acc.arr, 0);
  const criticalCount = accounts.filter(acc => acc.risk_score >= 0.75).length;
  const warningCount = accounts.filter(acc => acc.risk_score >= 0.25 && acc.risk_score < 0.75).length;
  const healthyCount = accounts.filter(acc => acc.risk_score < 0.25).length;
  
  const avgHealth = accounts.length 
    ? Math.round(100 - (accounts.reduce((sum, acc) => sum + acc.risk_score, 0) / accounts.length) * 100)
    : 100;

  const totalCount = accounts.length || 1;
  const criticalPct = (criticalCount / totalCount) * 100;
  const warningPct = (warningCount / totalCount) * 100;
  const healthyPct = (healthyCount / totalCount) * 100;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 md:px-8 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block shadow-[0_0_10px_#3b82f6]"></span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 font-heading">Blueberry AI</h1>
          </div>
          <p className="text-xs text-zinc-400">Customer Retention Radar • Google Cloud Agent Builder + Elastic</p>
        </div>
        
        {/* Search & Mode selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 self-start sm:self-auto">
            {(['client', 'keyword', 'vector', 'hybrid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setSearchMode(mode);
                  setSearchTerm('');
                  setSemanticMatches({});
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  searchMode === mode 
                    ? 'bg-zinc-800 text-zinc-50 border border-zinc-700/50 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode === 'client' && 'Local'}
                {mode === 'keyword' && 'BM25'}
                {mode === 'vector' && 'Vector'}
                {mode === 'hybrid' && 'Hybrid'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder={
                searchMode === 'client' ? "Filter list locally..." :
                searchMode === 'keyword' ? "Elastic keyword search..." :
                searchMode === 'vector' ? "Elastic semantic search..." : "Elastic hybrid search..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-zinc-800 bg-zinc-950/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
            />
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-zinc-850 mb-8 pb-px">
        <button
          onClick={() => setActiveTab('radar')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'radar' 
              ? 'text-zinc-50 font-semibold border-b-2 border-blue-500' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Retention Radar</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('mcp')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === 'mcp' 
              ? 'text-zinc-50 font-semibold border-b-2 border-blue-500' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>Elastic MCP Hub</span>
          </div>
        </button>
      </div>

      {activeTab === 'radar' && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total ARR Managed</span>
              <span className="text-2xl font-bold text-zinc-50 font-heading">${totalARR.toLocaleString()}</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                {accounts.length} active customer accounts
              </span>
            </div>

            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">At Risk Accounts</span>
              <span className="text-2xl font-bold text-zinc-50 font-heading">
                {criticalCount} <span className="text-sm font-normal text-zinc-400">critical</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                {warningCount} accounts flagged in warning status
              </span>
            </div>

            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Portfolio Health</span>
              <span className="text-2xl font-bold text-zinc-50 font-heading">{avgHealth}%</span>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full ${
                    avgHealth > 75 ? 'bg-emerald-500' : avgHealth > 45 ? 'bg-amber-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${avgHealth}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Account List Column */}
            <div className="lg:col-span-4">
              <h2 className="text-sm font-semibold text-zinc-350 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>Account Radar</span>
                <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono font-normal">
                  {filteredAccounts.length}
                </span>
              </h2>

              {loading ? (
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-12 text-center">
                  <span className="text-xs text-zinc-400 animate-pulse">Loading accounts from Elasticsearch...</span>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-12 text-center text-xs text-zinc-400">
                  No accounts matching "{searchTerm}" found.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredAccounts.map(acc => {
                    const isCrit = acc.risk_score >= 0.75;
                    const isWarn = acc.risk_score >= 0.25 && acc.risk_score < 0.75;
                    const riskPct = Math.round(acc.risk_score * 100);

                    return (
                      <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                        <div className="bg-zinc-950 border border-zinc-850 hover:border-zinc-750 p-4 rounded-xl cursor-pointer transition flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-bold text-zinc-100 hover:text-blue-400 transition">{acc.company_name}</h3>
                              <span className="text-[11px] text-zinc-500">{acc.account_id} • {acc.industry}</span>
                            </div>
                            
                            <span className={`risk-badge ${
                              isCrit ? 'bg-red-950/30 text-red-400 border border-red-900/50' :
                              isWarn ? 'bg-amber-950/30 text-amber-400 border border-amber-900/50' :
                              'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50'
                            } px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>
                              {isCrit ? 'Critical' : isWarn ? 'At Risk' : 'Healthy'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-zinc-900/50 pt-2 text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase block">ARR</span>
                              <strong className="text-zinc-200">${acc.arr.toLocaleString()}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-500 uppercase block">Risk Score</span>
                              <strong className={`font-mono ${
                                isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                              }`}>{riskPct}%</strong>
                            </div>
                          </div>

                          {/* Semantic Match Reason Snippet */}
                          {searchMode !== 'client' && semanticMatches[acc.account_id] && (
                            <div className="mt-1 p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed">
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

            {/* Analytics Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Distribution Chart */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Portfolio Distribution</h3>
                <div className="flex justify-center py-4">
                  <svg width="120" height="120" viewBox="0 0 36 36" className="-rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
                    {accounts.length > 0 ? (
                      <>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.2" 
                          strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.2" 
                          strokeDasharray={`${warningPct} ${100 - warningPct}`} strokeDashoffset={`-${criticalPct}`} />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" 
                          strokeDasharray={`${healthyPct} ${100 - healthyPct}`} strokeDashoffset={`-${criticalPct + warningPct}`} />
                      </>
                    ) : (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    )}
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex flex-col gap-2 mt-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Critical Risk (≥75%)
                    </span>
                    <strong className="text-zinc-200">{criticalCount}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      At Risk (25-74%)
                    </span>
                    <strong className="text-zinc-200">{warningCount}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Healthy (&lt;25%)
                    </span>
                    <strong className="text-zinc-200">{healthyCount}</strong>
                  </div>
                </div>
              </div>

              {/* Product Pain Points Clusters */}
              {painPoints.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product Pain-Points</h3>
                    <span className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-semibold uppercase">ARR Impact</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-4">Financial impact calculated by aggregating open tickets by category.</p>

                  <div className="flex flex-col gap-4">
                    {painPoints.map(cluster => {
                      const isHigh = cluster.arrAtRisk >= 500000;
                      const color = isHigh ? 'text-red-400' : 'text-amber-400';
                      const progressColor = isHigh ? 'bg-red-500' : 'bg-amber-500';

                      return (
                        <div key={cluster.id} className="border-b border-zinc-900/60 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1 text-xs">
                            <span className="font-semibold text-zinc-200">{cluster.category}</span>
                            <span className={`font-mono font-bold ${color}`}>${cluster.arrAtRisk.toLocaleString()}</span>
                          </div>
                          
                          <p className="text-[11px] text-zinc-450 leading-relaxed mb-2">{cluster.description}</p>
                          
                          <div className="flex justify-between items-center text-[10px] text-zinc-500">
                            <span>{cluster.count} open {cluster.count === 1 ? 'ticket' : 'tickets'}</span>
                            <span>Affected: {cluster.accounts.join(', ') || 'None'}</span>
                          </div>

                          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                            <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, (cluster.arrAtRisk / 600000) * 100)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CSM Ingestion & Event Simulator */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CSM Event Simulator</h3>
                  <span className="text-[10px] bg-blue-950/30 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded font-semibold uppercase">Demo Tool</span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4">Ingest simulated customer tickets, CSM notes, or calls and watch metrics update.</p>

                <form onSubmit={handleSimulateEvent} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Account</label>
                      <select
                        value={simAccountId}
                        onChange={(e) => setSimAccountId(e.target.value)}
                        className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-300 focus:outline-none focus:border-zinc-700"
                      >
                        {accounts.map(acc => (
                          <option key={acc.account_id} value={acc.account_id}>{acc.company_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Type</label>
                      <select
                        value={simType}
                        onChange={(e) => setSimType(e.target.value as any)}
                        className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-300 focus:outline-none focus:border-zinc-700"
                      >
                        <option value="ticket">Ticket</option>
                        <option value="note">CSM Note</option>
                        <option value="call">Phone Call</option>
                      </select>
                    </div>
                  </div>

                  {simType === 'ticket' && (
                    <>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Subject</label>
                        <input
                          type="text"
                          placeholder="e.g. SSO authentication failure"
                          value={simSubject}
                          onChange={(e) => setSimSubject(e.target.value)}
                          required
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description</label>
                        <textarea
                          placeholder="Bug details..."
                          value={simDesc}
                          onChange={(e) => setSimDesc(e.target.value)}
                          required
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none h-14 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Priority</label>
                        <select
                          value={simPriority}
                          onChange={(e) => setSimPriority(e.target.value)}
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-350 focus:outline-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </>
                  )}

                  {simType === 'note' && (
                    <>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Note Content</label>
                        <textarea
                          placeholder="Keywords like 'angry' or 'cancel' trigger negative sentiment..."
                          value={simNoteText}
                          onChange={(e) => setSimNoteText(e.target.value)}
                          required
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none h-16 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Author</label>
                        <input
                          type="text"
                          value={simAuthor}
                          onChange={(e) => setSimAuthor(e.target.value)}
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {simType === 'call' && (
                    <>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Phone Transcript</label>
                        <textarea
                          placeholder="Customer: The export timeout crashes..."
                          value={simTranscript}
                          onChange={(e) => setSimTranscript(e.target.value)}
                          required
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none h-16 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Summary</label>
                        <input
                          type="text"
                          placeholder="SSO export crashes."
                          value={simSummary}
                          onChange={(e) => setSimSummary(e.target.value)}
                          required
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Duration (Mins)</label>
                        <input
                          type="number"
                          value={simDuration}
                          onChange={(e) => setSimDuration(Number(e.target.value))}
                          className="w-full p-2 text-xs rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-zinc-50 rounded-md text-xs font-semibold cursor-pointer opacity-90 hover:opacity-100 transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${simulating ? 'animate-spin' : ''}`} />
                    {simulating ? 'Ingesting Event...' : 'Inject Event'}
                  </button>

                  {simMessage && (
                    <div className={`p-2 rounded text-center text-xs border ${
                      simMessage.startsWith('Success') 
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' 
                        : 'bg-red-950/30 text-red-400 border-red-900/40'
                    }`}>
                      {simMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Blueberry Copilot Column */}
            <div className="lg:col-span-4">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col h-[580px] overflow-hidden shadow-sm">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-zinc-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-200">Blueberry Copilot</h2>
                    <span className="text-[10px] text-zinc-500">Connected to GCP Agent Builder</span>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3.5">
                  {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={idx} 
                        className={`max-w-[85%] ${isUser ? 'self-end' : 'self-start'} animate-fade-in`}
                      >
                        <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-blue-600 text-zinc-50 rounded-br-none' 
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[9px] text-zinc-550 mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}
                  {sending && (
                    <div className="self-start flex flex-col gap-1.5">
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-150"></span>
                      </div>
                      <span className="text-[9px] text-zinc-500">Calling tools...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Actions Panel */}
                <div className="p-3 border-t border-zinc-900 bg-zinc-950 flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleSendMessage("Which accounts are currently at critical risk?")} 
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    ⚠️ Risks
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Summarize support ticket issues across the portfolio")} 
                    disabled={sending}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    🎫 Tickets
                  </button>
                </div>

                {/* Chat Input form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="p-3 border-t border-zinc-900 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask copilot anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={sending}
                    className="flex-grow pl-3 pr-2 py-2 text-xs rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputValue.trim()}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-zinc-50 rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'mcp' && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
          <div>
            <h2 className="text-base font-bold text-zinc-100 mb-1 flex items-center gap-2">
              <span>Model Context Protocol (MCP) Server Hub</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            </h2>
            <p className="text-xs text-zinc-450 max-w-3xl leading-relaxed">
              Blueberry AI implements a fully compliant MCP Server at <code className="text-[11px] text-blue-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">/api/mcp</code>.
              This interface allows external AI engines (such as Google Cloud Agent Builder) to query database indices, perform semantic lookups, and log customer health notes in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t border-zinc-900 pt-6">
            {/* Tool list */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Registered MCP Tools</h3>
              <div className="flex flex-col gap-3">
                {mcpTools.map(tool => (
                  <div
                    key={tool.name}
                    onClick={() => {
                      setSelectedMcpTool(tool);
                      if (tool.name === 'getAccountContext' || tool.name === 'getAgentMemory' || tool.name === 'getDynamicRiskScore' || tool.name === 'escalateAccount') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002' }, null, 2));
                      } else if (tool.name === 'writeHealthNote') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002', noteText: 'CSM scheduled a follow-up review for Friday.', sentiment: 'Neutral' }, null, 2));
                      } else if (tool.name === 'searchIssues') {
                        setMcpArgs(JSON.stringify({ query: 'export crash', accountId: 'ACC-002' }, null, 2));
                      } else if (tool.name === 'writeAgentMemory') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002', content: 'Customer prefers morning calls.', category: 'preference' }, null, 2));
                      } else if (tool.name === 'recommendRunbook') {
                        setMcpArgs(JSON.stringify({ ticketId: 'TKT-101' }, null, 2));
                      } else if (tool.name === 'simulateEvent') {
                        setMcpArgs(JSON.stringify({ type: 'ticket', accountId: 'ACC-002', subject: 'Simulated Crash Ticket', description: 'Okta SSO timeout failures in production.', priority: 'Urgent' }, null, 2));
                      } else {
                        setMcpArgs('{}');
                      }
                    }}
                    className={`p-3.5 rounded-lg border transition cursor-pointer ${
                      selectedMcpTool?.name === tool.name 
                        ? 'border-blue-500 bg-blue-950/10' 
                        : 'border-zinc-850 bg-zinc-950 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <strong className={`text-xs font-bold ${
                        selectedMcpTool?.name === tool.name ? 'text-blue-400' : 'text-zinc-200'
                      }`}>
                        {tool.name}
                      </strong>
                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                        tool
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-450 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Tool Console */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">MCP Execution Console</h3>
              {selectedMcpTool ? (
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-550 uppercase">Executing:</span>
                    <strong className="block text-xs font-bold text-blue-450 mt-0.5">{selectedMcpTool.name}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-550 uppercase block mb-1.5">Arguments JSON:</span>
                    <textarea
                      value={mcpArgs}
                      onChange={(e) => setMcpArgs(e.target.value)}
                      className="w-full h-24 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-emerald-400 font-mono text-[11px] outline-none"
                    />
                  </div>

                  <button
                    onClick={runMcpTool}
                    disabled={mcpRunning}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-zinc-50 rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60 transition"
                  >
                    {mcpRunning ? 'Running tool...' : '🔌 Call Tool'}
                  </button>

                  {mcpResult && (
                    <div>
                      <span className="text-[10px] text-zinc-550 uppercase block mb-1.5">Response Content:</span>
                      <pre className="w-full max-h-56 overflow-auto p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-200 font-mono text-[11px] leading-relaxed">
                        {mcpResult}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-8 text-center text-xs text-zinc-500">
                  Select a tool from the list to execute in the console.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
