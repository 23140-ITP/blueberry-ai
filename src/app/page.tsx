"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, LayoutDashboard, Brain, Activity, ShieldAlert, CheckCircle2, 
  AlertTriangle, ArrowRight, Terminal, Send, Play, RefreshCw, Layers, Sparkles, Menu, X, Database, SearchX,
  Gauge, TrendingDown, GitMerge, TrendingUp, TerminalSquare, Lock, Hexagon, Globe, Target, Info
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RiskRadar } from '@/components/RiskRadar';
import { EventSimulator } from '@/components/EventSimulator';
import { CopilotAction } from '@/components/CopilotAction';
import { ElserSearch } from '@/components/ElserSearch';
import { ApmDashboard } from '@/components/ApmDashboard';
import { AnomalyDetection } from '@/components/AnomalyDetection';
import { HybridSearch } from '@/components/HybridSearch';
import { EmergingTrends } from '@/components/EmergingTrends';
import { AgentLogs } from '@/components/AgentLogs';
import { DlsSimulator } from '@/components/DlsSimulator';
import { IlmTiering } from '@/components/IlmTiering';
import { VectorSearch } from '@/components/VectorSearch';
import { CrossCluster } from '@/components/CrossCluster';
import { RawDataExplorer } from '@/components/RawDataExplorer';
import { Tooltip } from '@/components/Tooltip';

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
  const [activeView, setActiveView] = useState<'radar' | 'pain-points' | 'simulator' | 'copilot' | 'mcp' | 'elser-search' | 'apm-dashboard' | 'anomaly-detection' | 'hybrid-search' | 'emerging-trends' | 'agent-logs' | 'dls-simulator' | 'ilm-tiering' | 'vector-search' | 'cross-cluster' | 'raw-data'>('radar');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Interactive UI Modal States
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [showArrAnalysis, setShowArrAnalysis] = useState(false);
  const [lastSubmittedEvent, setLastSubmittedEvent] = useState<any>(null);
  const [resetting, setResetting] = useState(false);

  // Missing States
  const [aggregations, setAggregations] = useState<any>(null);
  const [painPoints, setPainPoints] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<'client' | 'keyword' | 'hybrid' | 'vector'>('client');
  const [semanticMatches, setSemanticMatches] = useState<Record<string, number>>({});
  
  // MCP States
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [selectedMcpTool, setSelectedMcpTool] = useState<any>(null);
  const [mcpArgs, setMcpArgs] = useState('{}');
  const [mcpRunning, setMcpRunning] = useState(false);
  const [mcpResult, setMcpResult] = useState('');

  const fetchPainPoints = async () => {
    try {
      const res = await fetch('/api/tools/pain-points');
      const data = await res.json();
      if (data.clusters) {
        setPainPoints(data.clusters);
      }
    } catch (err) {
      console.error('Failed to load pain points:', err);
    }
  };

  // Chat and Simulation states are now handled in their respective components
  const fetchAccountsAndData = async () => {
    try {
      const resAcc = await fetch('/api/accounts');
      const dataAcc = await resAcc.json();
      if (dataAcc.accounts) {
        setAccounts(dataAcc.accounts);
      }
      if (dataAcc.aggregations) {
        setAggregations(dataAcc.aggregations);
      }
      fetchPainPoints();
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleResetDemoDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database back to original seed data? This will clear all simulated tickets, notes, call transcripts, and escalation milestones.')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/tools/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        
        // Reload all data
        setLoading(true);
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
        alert(`Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setResetting(false);
      setLoading(false);
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

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col justify-between transform transition-transform duration-200 md:translate-x-0 md:static md:h-screen shrink-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block shadow-[0_0_10px_#3b82f6]"></span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground font-heading">Blueberry AI</h1>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">Retention Radar v1.2</span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded hover:bg-card transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Options */}
          <nav className="p-4 flex flex-col gap-1.5">
            {[
              { id: 'radar', label: 'Retention Radar', icon: LayoutDashboard, desc: 'Overview of your portfolio risk, calculated via support sentiment and recent events.' },
              { id: 'pain-points', label: 'Pain-Point Clusters', icon: Layers, desc: 'Common issues grouped dynamically using kNN semantic search vectors.' },
              { id: 'war-room', label: 'Customer War Room', icon: ShieldAlert, href: accounts.length > 0 ? `/account/${accounts[0].account_id}` : '/account/ACC-002', desc: 'Deep dive into the highest-risk customer with What-If simulations and action planning.' },
              { id: 'simulator', label: 'Event Simulator', icon: RefreshCw, desc: 'Trigger mock CSM touchpoints or support tickets to see real-time risk updates.' },
              { id: 'copilot', label: 'Blueberry Copilot', icon: Brain, desc: 'AI assistant powered by GCP Agent Builder to summarize context and recommend runbooks.' },
              { id: 'mcp', label: 'Elastic MCP Hub', icon: Terminal, desc: 'Model Context Protocol console to directly interact with Elasticsearch indices.' },
              { id: 'elser-search', label: 'ELSER Semantic Search', icon: Sparkles, desc: 'Perform semantic search using Elastic Learned Sparse EncodeR models.' },
              { id: 'apm-dashboard', label: 'Elastic APM Tracing', icon: Gauge, desc: 'Monitor end-to-end API latency and distributed traces.' },
              { id: 'anomaly-detection', label: 'Anomaly Detection', icon: TrendingDown, desc: 'Unsupervised ML jobs alerting on unusual ticket volume or sentiment drops.' },
              { id: 'hybrid-search', label: 'Hybrid Search (RRF)', icon: GitMerge, desc: 'Combine keyword and vector search using Reciprocal Rank Fusion.' },
              { id: 'emerging-trends', label: 'Emerging Trends', icon: TrendingUp, desc: 'Discover unknown churn drivers via Significant Terms aggregation.' },
              { id: 'agent-logs', label: 'Agent Observability', icon: TerminalSquare, desc: 'Live stream of thought logs from GCP agents executing MCP tools.' },
              { id: 'dls-simulator', label: 'DLS Access Control', icon: Lock, desc: 'Simulate Document-Level Security filtering by user region.' },
              { id: 'ilm-tiering', label: 'ILM Data Tiering', icon: Database, desc: 'Visualize Index Lifecycle Management (Hot, Warm, Cold nodes).' },
              { id: 'vector-search', label: 'Vector Similarity', icon: Hexagon, desc: 'Generate dense vectors and find nearest neighbors via kNN.' },
              { id: 'cross-cluster', label: 'Cross-Cluster Search', icon: Globe, desc: 'Run federated searches across North America and Europe clusters.' },
              { id: 'raw-data', label: 'Raw Data Explorer', icon: Database, desc: 'Direct view into the Elasticsearch indices powering the Blueberry AI features.' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              const buttonContent = (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.href) {
                      setActiveView(item.id as any);
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-card border border-border text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  <span className="flex-grow text-left">{item.label}</span>
                </button>
              );

              return (
                <Tooltip key={item.id} content={item.desc} position="right" className="w-full">
                  {item.href ? (
                    <Link href={item.href}>
                      {buttonContent}
                    </Link>
                  ) : buttonContent}
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with system statuses */}
        <div className="p-4 border-t border-border bg-background flex flex-col gap-2.5 text-[10px] text-muted-foreground">
          <button
            onClick={handleResetDemoDatabase}
            disabled={resetting}
            className="w-full py-1.5 bg-card hover:bg-muted border border-border hover:border-border text-muted-foreground hover:text-foreground rounded text-[10px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Database className="h-3 w-3" />
            {resetting ? 'Resetting Demo...' : 'Reset Demo Database'}
          </button>
          <ThemeToggle />
          
          <div className="flex items-center justify-between border-t border-border/60 pt-2 mt-2">
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
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/20 backdrop-blur-md sticky top-0 z-30 min-h-[64px]">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground cursor-pointer p-1.5 rounded hover:bg-card transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-heading">
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
              <div className="inline-flex bg-card border border-border rounded-lg p-0.5">
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
                        ? 'bg-muted text-foreground border border-zinc-700/50 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
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
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={
                    searchMode === 'client' ? "Filter list locally..." :
                    searchMode === 'keyword' ? "Elastic keyword search..." :
                    searchMode === 'vector' ? "Elastic semantic search..." : "Elastic hybrid search..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 text-xs rounded-md border border-border bg-background/80 text-foreground placeholder-zinc-650 focus:outline-none focus:border-zinc-750 transition"
                />
              </div>
            </div>
          )}
        </header>

        {/* View Layout Panels */}
        <main className="flex-grow p-6 md:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-8">
          
          {/* VIEW 1: RETENTION RADAR OVERVIEW */}
          {activeView === 'radar' && (
            <RiskRadar 
              filteredAccounts={filteredAccounts}
              loading={loading}
              searchTerm={searchTerm}
              searchMode={searchMode}
              semanticMatches={semanticMatches}
            />
          )}

          {/* VIEW 2: PRODUCT PAIN POINT CLUSTERS */}
          {activeView === 'raw-data' && (
            <RawDataExplorer />
          )}

          {activeView === 'pain-points' && (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
              <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-400" />
                      <span>Product Pain-Point Clusters</span>
                      <Tooltip content="Clustered dynamically using Elasticsearch k-Nearest Neighbor (kNN) vector similarity on recent support tickets." position="top">
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </Tooltip>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Financial impact computed by aggregating support tickets into semantic categories.</p>
                  </div>
                  <button
                    onClick={() => setShowArrAnalysis(true)}
                    className="text-[10px] bg-blue-600 hover:bg-blue-700 text-foreground border border-blue-500 px-3 py-1.5 rounded font-semibold uppercase self-start sm:self-auto transition cursor-pointer"
                  >
                    ARR Impact Analysis
                  </button>
                </div>

                {painPoints.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No active product pain-points clusters found in Elasticsearch.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {painPoints.map(cluster => {
                      const isHigh = cluster.arrAtRisk >= 500000;
                      const color = isHigh ? 'text-red-400' : 'text-amber-400';
                      const progressColor = isHigh ? 'bg-red-500' : 'bg-amber-500';

                      return (
                        <div 
                          key={cluster.id} 
                          onClick={() => setSelectedCluster(cluster)}
                          className="p-5 rounded-xl bg-card/30 border border-border hover:border-border flex flex-col gap-4 transition cursor-pointer"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {cluster.count} Open {cluster.count === 1 ? 'ticket' : 'tickets'} • Click to Drill down
                              </span>
                              <h4 className="text-base font-semibold text-foreground mt-0.5">{cluster.category}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground uppercase block">ARR-at-Risk</span>
                              <span className={`font-mono text-base font-bold ${color}`}>${cluster.arrAtRisk.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground leading-relaxed">{cluster.description}</p>
                          
                          {/* Progress bar */}
                          <div className="flex flex-col gap-1.5">
                            <div className="w-full bg-background border border-border h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, (cluster.arrAtRisk / 750000) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span>Impact rating: {isHigh ? 'Urgent Priority' : 'Standard Priority'}</span>
                              <span className="font-semibold text-muted-foreground">Affected accounts: {cluster.accounts.join(', ') || 'None'}</span>
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
            <EventSimulator accounts={accounts} onSimulateComplete={fetchAccountsAndData} />
          )}

          {/* VIEW 4: BLUEBERRY COPILOT */}
          {activeView === 'copilot' && (
            <CopilotAction />
          )}

          {/* VIEW 5: MODEL CONTEXT PROTOCOL */}
          {activeView === 'mcp' && (
            <div className="bg-background border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 animate-fade-in shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <span>Model Context Protocol (MCP) Server Hub</span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                </h3>
                <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                  Blueberry AI implements a fully compliant MCP Server at <code className="text-[11px] text-blue-400 bg-card px-1.5 py-0.5 rounded border border-border font-mono">/api/mcp</code>.
                  This interface allows external AI engines (such as Google Cloud Agent Builder) to query database indices, perform semantic lookups, and log customer health notes in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start border-t border-border pt-6">
                {/* Tool list */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Registered MCP Tools</h4>
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
                            : 'border-border bg-background hover:bg-card/40'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <strong className={`text-xs font-bold ${
                            selectedMcpTool?.name === tool.name ? 'text-blue-400' : 'text-foreground'
                          }`}>
                            {tool.name}
                          </strong>
                          <span className="text-[9px] bg-card border border-border text-muted-foreground px-1.5 py-0.5 rounded">
                            tool
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run Tool Console */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">MCP Execution Console</h4>
                  {selectedMcpTool ? (
                    <div className="bg-background border border-border rounded-xl p-5 flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Executing:</span>
                        <strong className="block text-xs font-bold text-blue-450 mt-0.5">{selectedMcpTool.name}</strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase block mb-1.5">Arguments JSON:</span>
                        <textarea
                          value={mcpArgs}
                          onChange={(e) => setMcpArgs(e.target.value)}
                          className="w-full h-24 p-3 bg-card/60 border border-border rounded-lg text-emerald-450 font-mono text-[11px] outline-none"
                        />
                      </div>

                      <button
                        onClick={runMcpTool}
                        disabled={mcpRunning}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-foreground rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60 transition"
                      >
                        {mcpRunning ? 'Running tool...' : '🔌 Call Tool'}
                      </button>

                      {mcpResult && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block mb-1.5">Response Content:</span>
                          <pre className="w-full max-h-56 overflow-auto p-3.5 bg-card/80 border border-border rounded-lg text-foreground font-mono text-[11px] leading-relaxed">
                            {mcpResult}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-background border border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                      Select a tool from the list to execute in the console.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: ELSER SEARCH */}
          {activeView === 'elser-search' && (
            <ElserSearch />
          )}

          {/* VIEW 7: APM DASHBOARD */}
          {activeView === 'apm-dashboard' && (
            <ApmDashboard />
          )}

          {/* VIEW 8: ANOMALY DETECTION */}
          {activeView === 'anomaly-detection' && (
            <AnomalyDetection />
          )}

          {/* VIEW 9: HYBRID SEARCH */}
          {activeView === 'hybrid-search' && (
            <HybridSearch />
          )}

          {/* VIEW 10: EMERGING TRENDS */}
          {activeView === 'emerging-trends' && (
            <EmergingTrends />
          )}

          {/* VIEW 11: AGENT LOGS */}
          {activeView === 'agent-logs' && (
            <AgentLogs />
          )}

          {/* VIEW 12: DLS SIMULATOR */}
          {activeView === 'dls-simulator' && (
            <DlsSimulator />
          )}

          {/* VIEW 13: ILM TIERING */}
          {activeView === 'ilm-tiering' && (
            <IlmTiering />
          )}

          {/* VIEW 14: VECTOR SEARCH */}
          {activeView === 'vector-search' && (
            <VectorSearch />
          )}

          {/* VIEW 15: CROSS-CLUSTER */}
          {activeView === 'cross-cluster' && (
            <CrossCluster />
          )}
        </main>
      </div>

      {/* MODAL 1: PAIN-POINT CLUSTER DRILL-DOWN MODAL (Bug 10 / Suggestion 3) */}
      {selectedCluster && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[999] backdrop-blur-xs">
          <div className="bg-background border border-border w-[90%] max-w-[700px] max-h-[80vh] overflow-y-auto p-6 md:p-8 rounded-xl flex flex-col gap-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Pain-Point Cluster Details</span>
                <h3 className="text-base font-bold text-foreground">{selectedCluster.category}</h3>
              </div>
              <button 
                onClick={() => setSelectedCluster(null)}
                className="px-2.5 py-1 text-xs rounded border border-border bg-card text-muted-foreground hover:text-zinc-250 cursor-pointer transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{selectedCluster.description}</p>
            
            <div className="flex justify-between items-center text-xs border-y border-border/80 py-3 mt-1 bg-card/20 px-3 rounded-lg">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase">Total ARR affected</span>
                <strong className="text-sm text-red-400 font-bold font-mono">${selectedCluster.arrAtRisk.toLocaleString()}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block uppercase">Active Tickets</span>
                <strong className="text-sm text-foreground font-bold font-mono">{selectedCluster.count} open</strong>
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3.5">Associated Support Tickets</h4>
              <div className="flex flex-col gap-3">
                {selectedCluster.tickets && selectedCluster.tickets.length > 0 ? (
                  selectedCluster.tickets.map((t: any) => (
                    <div key={t.ticket_id} className="p-3.5 rounded-lg border border-border bg-background flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-zinc-150">
                          {t.ticket_id} • {t.subject}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          t.priority === 'Urgent' ? 'bg-red-950/30 text-red-400 border border-red-900/40' : 'bg-card border border-border text-muted-foreground'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>Affected Client: <strong className="text-muted-foreground">{t.companyName}</strong></span>
                        <Link href={`/account/${t.account_id}`}>
                          <span className="text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                            View Account Details
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground text-center py-4">No open tickets listed.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ARR IMPACT ANALYSIS TABLE MODAL (Bug 9) */}
      {showArrAnalysis && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[999] backdrop-blur-xs">
          <div className="bg-background border border-border w-[90%] max-w-[800px] max-h-[80vh] overflow-y-auto p-6 md:p-8 rounded-xl flex flex-col gap-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">ARR Impact Analysis</span>
                <h3 className="text-base font-bold text-foreground">Customer Portfolio Risk Table</h3>
              </div>
              <button 
                onClick={() => setShowArrAnalysis(false)}
                className="px-2.5 py-1 text-xs rounded border border-border bg-card text-muted-foreground hover:text-zinc-250 cursor-pointer transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              A comprehensive breakdown of all accounts, their revenue, and dynamic risk statuses currently index-locked in Elasticsearch.
            </p>

            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs text-left text-muted-foreground">
                <thead className="text-[10px] uppercase bg-background text-muted-foreground border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-3">Account ID</th>
                    <th scope="col" className="px-4 py-3">Company Name</th>
                    <th scope="col" className="px-4 py-3">Industry</th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <Tooltip content="Annual Recurring Revenue: Total contract value currently at risk." position="top">
                        <span className="border-b border-dashed border-muted-foreground/50 cursor-help pb-0.5">ARR</span>
                      </Tooltip>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <Tooltip content="Calculated dynamically via Elasticsearch ML by evaluating support ticket sentiment, usage drops, and recent billing events. Score > 0.75 is Critical." position="top">
                        <span className="border-b border-dashed border-muted-foreground/50 cursor-help pb-0.5">Risk Score</span>
                      </Tooltip>
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {accounts.map(acc => {
                    const isCrit = acc.risk_score >= 0.75;
                    const isWarn = acc.risk_score >= 0.25 && acc.risk_score < 0.75;
                    return (
                      <tr key={acc.account_id} className="hover:bg-card/30">
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{acc.account_id}</td>
                        <td className="px-4 py-3.5 font-bold text-foreground hover:text-blue-400 transition cursor-pointer">
                          <Link href={`/account/${acc.account_id}`}>{acc.company_name}</Link>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{acc.industry}</td>
                        <td className="px-4 py-3.5 text-right font-mono">${acc.arr.toLocaleString()}</td>
                        <td className={`px-4 py-3.5 text-right font-bold font-mono ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {Math.round(acc.risk_score * 100)}%
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isCrit ? 'bg-red-950/30 text-red-400 border border-red-900/50' :
                            isWarn ? 'bg-amber-950/30 text-amber-400 border border-amber-900/50' :
                            'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50'
                          }`}>
                            {isCrit ? 'Critical' : isWarn ? 'At Risk' : 'Healthy'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
