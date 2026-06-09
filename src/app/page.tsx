"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, LayoutDashboard, Brain, Activity, ShieldAlert, CheckCircle2, 
  AlertTriangle, ArrowRight, Terminal, Send, Play, RefreshCw, Layers, Sparkles, Menu, X
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

  // Layout View State
  const [activeView, setActiveView] = useState<'radar' | 'pain-points' | 'simulator' | 'copilot' | 'mcp'>('radar');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="min-h-screen flex bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between transform transition-transform duration-200 md:translate-x-0 md:static md:h-screen shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full inline-block shadow-[0_0_10px_#3b82f6]"></span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-zinc-50 font-heading">Blueberry AI</h1>
                <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">Retention Radar v1.1</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-zinc-400 hover:text-zinc-200 cursor-pointer p-1 rounded hover:bg-zinc-900 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Options */}
          <nav className="p-4 flex flex-col gap-1.5">
            {[
              { id: 'radar', label: 'Retention Radar', icon: LayoutDashboard },
              { id: 'pain-points', label: 'Pain-Point Clusters', icon: Layers },
              { id: 'simulator', label: 'Event Simulator', icon: RefreshCw },
              { id: 'copilot', label: 'Blueberry Copilot', icon: Brain },
              { id: 'mcp', label: 'Elastic MCP Hub', icon: Terminal }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-50 shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with system statuses */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 flex flex-col gap-2.5 text-[10px] text-zinc-500">
          <div className="flex items-center justify-between">
            <span className="font-medium">Elasticsearch</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              v9.5.0
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Dialogflow CX</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-850 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-30 min-h-[64px]">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-zinc-400 hover:text-zinc-200 cursor-pointer p-1.5 rounded hover:bg-zinc-900 transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-heading">
              {activeView === 'radar' && 'Retention Radar'}
              {activeView === 'pain-points' && 'Product Pain-Point Clusters'}
              {activeView === 'simulator' && 'CSM Ingestion Simulator'}
              {activeView === 'copilot' && 'Blueberry Chat Copilot'}
              {activeView === 'mcp' && 'Model Context Protocol'}
            </h2>
          </div>

          {/* Search bar specifically visible in Dashboard View */}
          {activeView === 'radar' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {(['client', 'keyword', 'vector', 'hybrid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSearchMode(mode);
                      setSearchTerm('');
                      setSemanticMatches({});
                    }}
                    className={`px-3 py-1 text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
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

              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder={
                    searchMode === 'client' ? "Filter list locally..." :
                    searchMode === 'keyword' ? "Elastic keyword search..." :
                    searchMode === 'vector' ? "Elastic semantic search..." : "Elastic hybrid search..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 text-xs rounded-md border border-zinc-850 bg-zinc-950/80 text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-zinc-750 transition"
                />
              </div>
            </div>
          )}
        </header>

        {/* View Layout Panels */}
        <main className="flex-grow p-6 md:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-8">
          
          {/* VIEW 1: RETENTION RADAR OVERVIEW */}
          {activeView === 'radar' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Main radar panel split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Account list card */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-zinc-450 uppercase tracking-wider flex items-center gap-2">
                    <span>Account List</span>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                      {filteredAccounts.length}
                    </span>
                  </h3>

                  {loading ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-12 text-center">
                      <span className="text-xs text-zinc-400 animate-pulse">Loading accounts from Elasticsearch...</span>
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-12 text-center text-xs text-zinc-400">
                      No accounts matching "{searchTerm}" found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAccounts.map(acc => {
                        const isCrit = acc.risk_score >= 0.75;
                        const isWarn = acc.risk_score >= 0.25 && acc.risk_score < 0.75;
                        const riskPct = Math.round(acc.risk_score * 100);

                        return (
                          <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                            <div className="bg-zinc-950 border border-zinc-850 hover:border-zinc-750 p-4.5 rounded-xl cursor-pointer transition flex flex-col gap-3.5 h-full">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-100 hover:text-blue-400 transition">{acc.company_name}</h4>
                                  <span className="text-[11px] text-zinc-500">{acc.account_id} • {acc.industry}</span>
                                </div>
                                
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isCrit ? 'bg-red-950/30 text-red-400 border border-red-900/50' :
                                  isWarn ? 'bg-amber-950/30 text-amber-400 border border-amber-900/50' :
                                  'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50'
                                }`}>
                                  {isCrit ? 'Critical' : isWarn ? 'At Risk' : 'Healthy'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center border-t border-zinc-900/50 pt-2 text-xs mt-auto">
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

                {/* Distribution chart panel */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <h3 className="text-xs font-semibold text-zinc-450 uppercase tracking-wider">Portfolio Analytics</h3>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 shadow-sm flex flex-col items-center">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider self-start mb-4">Portfolio Distribution</span>
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
                    <div className="w-full flex flex-col gap-2.5 mt-4 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900/40">
                        <span className="flex items-center gap-2 text-zinc-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Critical Risk (≥75%)
                        </span>
                        <strong className="text-zinc-200">{criticalCount}</strong>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900/40">
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
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: PRODUCT PAIN POINT CLUSTERS */}
          {activeView === 'pain-points' && (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-zinc-900">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-400" />
                      <span>Product Pain-Point Clusters</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Financial impact computed by aggregating support tickets into semantic categories.</p>
                  </div>
                  <span className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/40 px-2.5 py-1 rounded font-semibold uppercase self-start sm:self-auto">
                    ARR Impact Analysis
                  </span>
                </div>

                {painPoints.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    No active product pain-points clusters found in Elasticsearch.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {painPoints.map(cluster => {
                      const isHigh = cluster.arrAtRisk >= 500000;
                      const color = isHigh ? 'text-red-400' : 'text-amber-400';
                      const progressColor = isHigh ? 'bg-red-500' : 'bg-amber-500';

                      return (
                        <div key={cluster.id} className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-850 flex flex-col gap-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {cluster.count} Open {cluster.count === 1 ? 'ticket' : 'tickets'}
                              </span>
                              <h4 className="text-base font-semibold text-zinc-200 mt-0.5">{cluster.category}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-550 uppercase block">ARR-at-Risk</span>
                              <span className={`font-mono text-base font-bold ${color}`}>${cluster.arrAtRisk.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-zinc-350 leading-relaxed">{cluster.description}</p>
                          
                          {/* Progress bar */}
                          <div className="flex flex-col gap-1.5">
                            <div className="w-full bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, (cluster.arrAtRisk / 750000) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                              <span>Impact rating: {isHigh ? 'Urgent Priority' : 'Standard Priority'}</span>
                              <span className="font-semibold text-zinc-400">Affected accounts: {cluster.accounts.join(', ') || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: EVENT SIMULATOR */}
          {activeView === 'simulator' && (
            <div className="max-w-2xl mx-auto w-full animate-fade-in">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-900">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-400" />
                      <span>CSM Ingestion & Event Simulator</span>
                    </h3>
                    <p className="text-xs text-zinc-450 mt-1">Simulate real-time support events or CSM updates across the database.</p>
                  </div>
                  <span className="text-[10px] bg-blue-950/30 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded font-semibold uppercase">Demo Console</span>
                </div>

                <form onSubmit={handleSimulateEvent} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Target Customer Account</label>
                      <select
                        value={simAccountId}
                        onChange={(e) => setSimAccountId(e.target.value)}
                        className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/60 text-zinc-200 focus:outline-none focus:border-zinc-750"
                      >
                        {accounts.map(acc => (
                          <option key={acc.account_id} value={acc.account_id}>{acc.company_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Activity Category</label>
                      <select
                        value={simType}
                        onChange={(e) => setSimType(e.target.value as any)}
                        className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/60 text-zinc-200 focus:outline-none focus:border-zinc-750"
                      >
                        <option value="ticket">Customer Support Ticket</option>
                        <option value="note">CSM Health Note</option>
                        <option value="call">CSM Call Transcript</option>
                      </select>
                    </div>
                  </div>

                  {simType === 'ticket' && (
                    <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Ticket Subject</label>
                        <input
                          type="text"
                          placeholder="e.g. SSO Login failures after maintenance release"
                          value={simSubject}
                          onChange={(e) => setSimSubject(e.target.value)}
                          required
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Ticket Description</label>
                        <textarea
                          placeholder="Provide error logs, customer complaints, or steps to reproduce..."
                          value={simDesc}
                          onChange={(e) => setSimDesc(e.target.value)}
                          required
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Ticket Priority</label>
                        <select
                          value={simPriority}
                          onChange={(e) => setSimPriority(e.target.value)}
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-200 focus:outline-none focus:border-zinc-700"
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
                    <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Note Content</label>
                        <textarea
                          placeholder="Log updates. Sentiment models flag negative feedback (e.g. 'unhappy', 'threaten to cancel')."
                          value={simNoteText}
                          onChange={(e) => setSimNoteText(e.target.value)}
                          required
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider font-semibold">Author</label>
                        <input
                          type="text"
                          value={simAuthor}
                          onChange={(e) => setSimAuthor(e.target.value)}
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {simType === 'call' && (
                    <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4 animate-fade-in">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Call Transcript Summary</label>
                        <textarea
                          placeholder="Summarize the transcription contents..."
                          value={simTranscript}
                          onChange={(e) => setSimTranscript(e.target.value)}
                          required
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Key Takeaway</label>
                        <input
                          type="text"
                          placeholder="e.g. SSO export crashes frequently during reports."
                          value={simSummary}
                          onChange={(e) => setSimSummary(e.target.value)}
                          required
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wider">Duration (Minutes)</label>
                        <input
                          type="number"
                          value={simDuration}
                          onChange={(e) => setSimDuration(Number(e.target.value))}
                          className="w-full p-2.5 text-xs rounded border border-zinc-800 bg-zinc-900/40 text-zinc-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-zinc-50 rounded-md text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${simulating ? 'animate-spin' : ''}`} />
                    {simulating ? 'Ingesting Event Details...' : 'Simulate Event Ingestion'}
                  </button>

                  {simMessage && (
                    <div className={`p-3 rounded text-center text-xs border ${
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
          )}

          {/* VIEW 4: BLUEBERRY COPILOT */}
          {activeView === 'copilot' && (
            <div className="max-w-3xl mx-auto w-full animate-fade-in">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col h-[650px] overflow-hidden shadow-sm">
                
                {/* Chat Header */}
                <div className="p-4.5 border-b border-zinc-900 flex items-center gap-2.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_#10b981]"></span>
                  <div>
                    <h2 className="text-xs font-bold text-zinc-200">Blueberry Copilot Workspace</h2>
                    <span className="text-[10px] text-zinc-500">Connected to Dialogflow CX Google Cloud Agent</span>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4">
                  {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={idx} 
                        className={`max-w-[80%] ${isUser ? 'self-end' : 'self-start'} animate-fade-in`}
                      >
                        <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-blue-600 text-zinc-50 rounded-br-none' 
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[9px] text-zinc-500 mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
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
                      <span className="text-[9px] text-zinc-500">Querying Agent...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Actions Panel */}
                <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 flex flex-wrap gap-1.5 justify-center">
                  <button 
                    onClick={() => handleSendMessage("Which accounts are currently at critical risk?")} 
                    disabled={sending}
                    className="text-[10px] px-3 py-1 rounded-full border border-zinc-850 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    ⚠️ Risks
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Summarize support ticket issues across the portfolio")} 
                    disabled={sending}
                    className="text-[10px] px-3 py-1 rounded-full border border-zinc-850 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                  >
                    🎫 Tickets
                  </button>
                </div>

                {/* Chat Input form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="p-4 border-t border-zinc-900 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask copilot anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={sending}
                    className="flex-grow pl-3 pr-2 py-2 text-xs rounded-md border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputValue.trim()}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-zinc-50 rounded-md text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 5: MODEL CONTEXT PROTOCOL */}
          {activeView === 'mcp' && (
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1 flex items-center gap-2">
                  <span>Model Context Protocol (MCP) Server Hub</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                </h3>
                <p className="text-xs text-zinc-450 max-w-3xl leading-relaxed">
                  Blueberry AI implements a fully compliant MCP Server at <code className="text-[11px] text-blue-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">/api/mcp</code>.
                  This interface allows external AI engines (such as Google Cloud Agent Builder) to query database indices, perform semantic lookups, and log customer health notes in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t border-zinc-900 pt-6">
                {/* Tool list */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Registered MCP Tools</h4>
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
                        <p className="text-[11px] text-zinc-455 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run Tool Console */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">MCP Execution Console</h4>
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
                          className="w-full h-24 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-emerald-450 font-mono text-[11px] outline-none"
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
        </main>
      </div>
    </div>
  );
}
