"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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

  function getRiskClass(score: number) {
    if (score >= 0.75) return 'critical';
    if (score >= 0.25) return 'at-risk';
    return 'healthy';
  }

  function getRiskLabel(score: number) {
    if (score >= 0.75) return 'Critical';
    if (score >= 0.25) return 'At Risk';
    return 'Healthy';
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1650px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 12px #3b82f6'
            }}></span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Blueberry AI</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customer Retention Radar • Google Cloud Agent Builder + Elastic</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="glass-panel" style={{ display: 'flex', padding: '3px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
            {(['client', 'keyword', 'vector', 'hybrid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setSearchMode(mode);
                  setSearchTerm('');
                  setSemanticMatches({});
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: searchMode === mode ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: searchMode === mode ? '#60a5fa' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                  boxShadow: searchMode === mode ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'none'
                }}
              >
                {mode === 'client' && '📱 Local'}
                {mode === 'keyword' && '🔍 BM25'}
                {mode === 'vector' && '⚡ Vector'}
                {mode === 'hybrid' && '🧬 Hybrid'}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={
              searchMode === 'client' ? "Filter list locally..." :
              searchMode === 'keyword' ? "Elastic keyword search..." :
              searchMode === 'vector' ? "Elastic semantic search..." : "Elastic hybrid search..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              width: '320px',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>
      </header>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2.5rem', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('radar')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'radar' ? '#60a5fa' : 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.5rem 1.25rem',
            borderBottom: activeTab === 'radar' ? '2px solid #3b82f6' : 'none',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)'
          }}
        >
          📊 Retention Radar
        </button>
        <button
          onClick={() => setActiveTab('mcp')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'mcp' ? '#60a5fa' : 'var(--text-secondary)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.5rem 1.25rem',
            borderBottom: activeTab === 'mcp' ? '2px solid #3b82f6' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-body)'
          }}
        >
          ⚡ Elastic MCP Hub
        </button>
      </div>

      {activeTab === 'radar' && (
        <>
          {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total ARR Managed</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
            ${totalARR.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ● {accounts.length} active customer accounts
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>At Risk Accounts</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: criticalCount > 0 ? '#f87171' : 'inherit' }}>
            {criticalCount} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>critical</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {warningCount} warning status alerts active
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Health Score</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
            {avgHealth}%
          </span>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{
              width: `${avgHealth}%`,
              height: '100%',
              backgroundColor: avgHealth > 70 ? 'var(--success)' : avgHealth > 40 ? 'var(--warning)' : 'var(--danger)',
              boxShadow: '0 0 8px rgba(59,130,246,0.3)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts List, Analytics, and Copilot Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr', gap: '2rem' }}>
        {/* Account List Column */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Account Radar</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              {filteredAccounts.length} listed
            </span>
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <span className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Fetching accounts from Elasticsearch...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No accounts matching "{searchTerm}" found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAccounts.map(acc => {
                const riskTier = getRiskClass(acc.risk_score);
                const riskPct = Math.round(acc.risk_score * 100);

                return (
                  <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                    <div className="glass-panel animate-fade-in" style={{
                      padding: '1.25rem 1.5rem',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 12px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Name & ID */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{acc.company_name}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.account_id} • {acc.industry}</span>
                      </div>

                      {/* ARR */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ARR</span>
                        <span style={{ fontWeight: 600 }}>${acc.arr.toLocaleString()}</span>
                      </div>

                      {/* Risk Score */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Risk Score</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flexGrow: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', width: '80px' }}>
                            <div style={{
                              width: `${riskPct}%`,
                              height: '100%',
                              backgroundColor: riskTier === 'critical' ? 'var(--danger)' : riskTier === 'at-risk' ? 'var(--warning)' : 'var(--success)'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: riskTier === 'critical' ? '#f87171' : riskTier === 'at-risk' ? '#fbbf24' : '#34d399' }}>{riskPct}%</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`risk-badge ${riskTier}`}>
                          <span className={`pulse-dot ${riskTier}`}></span>
                          {getRiskLabel(acc.risk_score)}
                        </span>
                      </div>

                      {/* Arrow Icon */}
                      <div style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                        →
                      </div>

                      {/* Semantic Match Reason Snippet */}
                      {searchMode !== 'client' && semanticMatches[acc.account_id] && (
                        <div style={{
                          gridColumn: '1 / -1',
                          marginTop: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4'
                        }}>
                          <span style={{ fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            ⚡ Elastic {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)} Match • {semanticMatches[acc.account_id].relevanceScore}% Relevance
                          </span>
                          <p dangerouslySetInnerHTML={{ __html: semanticMatches[acc.account_id].matchReason }} style={{ margin: 0 }} />
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
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Distribution</h2>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Portfolio Health Status</h3>
            
            {/* Simple SV Donut/Distribution representation */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
              <svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                
                {/* Dynamically drawing donut parts based on counts */}
                {accounts.length > 0 ? (
                  <>
                    {/* Critical section */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="3" 
                      strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0" />
                      
                    {/* Warning section */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3" 
                      strokeDasharray={`${warningPct} ${100 - warningPct}`} strokeDashoffset={`-${criticalPct}`} />
                      
                    {/* Healthy section */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--success)" strokeWidth="3" 
                      strokeDasharray={`${healthyPct} ${100 - healthyPct}`} strokeDashoffset={`-${criticalPct + warningPct}`} />
                  </>
                ) : (
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                )}
                  
                {/* Text overlay */}
                <g style={{ transform: 'rotate(90deg) translate(0px, -36px)' }}>
                  <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-primary)" fontSize="5" fontWeight="bold" fontFamily="var(--font-title)">
                    {accounts.length}
                  </text>
                  <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-muted)" fontSize="2.5" fontWeight="normal">
                    Accounts
                  </text>
                </g>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                  <span>Critical Risk (≥75%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{criticalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--warning)', borderRadius: '50%' }}></span>
                  <span>Warning Status (25-74%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{warningCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></span>
                  <span>Healthy (&lt;25%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{healthyCount}</span>
              </div>
            </div>
          </div>

          {/* Prioritization Quadrant Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>CSM Prioritization Quadrant</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action map of ARR vs Churn Risk. Click points to inspect.</span>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <svg width="100%" height="220" viewBox="0 0 320 220" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Quadrant backgrounds */}
                <rect x="40" y="20" width="120" height="70" fill="rgba(52, 211, 153, 0.02)" /> {/* Top Left: Safe High ARR */}
                <rect x="160" y="20" width="120" height="70" fill="rgba(239, 68, 68, 0.04)" />  {/* Top Right: Critical Churn */}
                <rect x="40" y="90" width="120" height="70" fill="rgba(255, 255, 255, 0.01)" /> {/* Bottom Left: Low Risk */}
                <rect x="160" y="90" width="120" height="70" fill="rgba(245, 158, 11, 0.02)" />  {/* Bottom Right: Low ARR Risk */}

                {/* Grid Axes */}
                <line x1="40" y1="160" x2="280" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="40" y1="20" x2="40" y2="160" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Quadrant Divider Gridlines */}
                <line x1="160" y1="20" x2="160" y2="160" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="90" x2="280" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Grid Labels */}
                <text x="160" y="180" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Risk Score (%)</text>
                <text x="10" y="90" textAnchor="middle" fill="var(--text-muted)" fontSize="8" transform="rotate(-90 10 90)">ARR ($k)</text>

                {/* Grid ticks */}
                <text x="40" y="170" textAnchor="middle" fill="var(--text-muted)" fontSize="7">0%</text>
                <text x="160" y="170" textAnchor="middle" fill="var(--text-muted)" fontSize="7">50%</text>
                <text x="280" y="170" textAnchor="middle" fill="var(--text-muted)" fontSize="7">100%</text>

                <text x="35" y="160" textAnchor="end" fill="var(--text-muted)" fontSize="7" dominantBaseline="middle">$0</text>
                <text x="35" y="90" textAnchor="end" fill="var(--text-muted)" fontSize="7" dominantBaseline="middle">$300k</text>
                <text x="35" y="20" textAnchor="end" fill="var(--text-muted)" fontSize="7" dominantBaseline="middle">$600k</text>

                {/* Quadrant Name Overlays */}
                <text x="100" y="30" textAnchor="middle" fill="rgba(52, 211, 153, 0.4)" fontSize="6" fontWeight="bold">SAFE KEY</text>
                <text x="220" y="30" textAnchor="middle" fill="rgba(239, 68, 68, 0.7)" fontSize="6" fontWeight="bold" className="animate-pulse">CRITICAL ACTION 🔥</text>
                <text x="100" y="100" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontWeight="bold">HEALTHY</text>
                <text x="220" y="100" textAnchor="middle" fill="rgba(245, 158, 11, 0.4)" fontSize="6" fontWeight="bold">WATCHLIST</text>

                {/* Plot Data points */}
                {accounts.map(acc => {
                  const x = 40 + (acc.risk_score * 240);
                  const y = 160 - (Math.min(acc.arr, 600000) / 600000) * 140;
                  const color = acc.risk_score >= 0.75 ? 'var(--danger)' : acc.risk_score >= 0.25 ? 'var(--warning)' : 'var(--success)';
                  const glowColor = acc.risk_score >= 0.75 ? 'rgba(239, 68, 68, 0.8)' : acc.risk_score >= 0.25 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(52, 211, 153, 0.6)';

                  return (
                    <a key={acc.account_id} href={`/account/${acc.account_id}`} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill={color}
                        stroke="#fff"
                        strokeWidth="1.5"
                        style={{
                          filter: `drop-shadow(0 0 6px ${glowColor})`,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.setAttribute('r', '9'); }}
                        onMouseOut={(e) => { e.currentTarget.setAttribute('r', '6'); }}
                      />
                      {/* Label next to circle */}
                      <text x={x} y={y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="7" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                        {acc.company_name}
                      </text>
                    </a>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Industry Breakdown Card (Elastic Aggregations) */}
          {aggregations.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Industry Health Profile</h3>
                <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Elastic Aggs</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Dynamic terms and average metric aggregates computed directly inside Elasticsearch.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {aggregations.map(agg => {
                  const riskPct = Math.round(agg.avgRisk * 100);
                  const isHigh = riskPct >= 75;
                  const isWarn = riskPct >= 25 && riskPct < 75;
                  const riskColor = isHigh ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)';

                  return (
                    <div key={agg.industry} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{agg.industry}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: riskColor }}>
                          {riskPct}% Avg Risk
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>{agg.count} {agg.count === 1 ? 'account' : 'accounts'} active</span>
                        <span>Total ARR: ${agg.totalArr.toLocaleString()}</span>
                      </div>

                      {/* Small aggregation visual bar */}
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                        <div style={{
                          width: `${riskPct}%`,
                          height: '100%',
                          backgroundColor: riskColor
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Center */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Live Alert Center</span>
              <span className="pulse-dot critical"></span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>SSO / Export Crash</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginTop: '2px', marginBottom: '2px' }}>TechFlow (ACC-002)</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VP threatened to churn by Friday due to report timeout crashes.</p>
              </div>
              
              <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Missing Contact Alert</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginTop: '2px', marginBottom: '2px' }}>Global Industries (ACC-003)</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No CSM activity recorded for 25 days. Risk score rising.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blueberry Copilot Column */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', position: 'sticky', top: '2rem', overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="pulse-dot healthy"></span>
            <div>
              <h2 style={{ fontSize: '1.1rem' }}>Blueberry Copilot</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected to GCP Agent Builder</span>
            </div>
          </div>

          {/* Chat messages list */}
          <div style={{ flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  animation: 'fadeIn 0.2s ease forwards'
                }}>
                  <div style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: isUser ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line',
                    boxShadow: isUser ? '0 4px 15px rgba(59, 130, 246, 0.15)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginTop: '4px',
                    textAlign: isUser ? 'right' : 'left'
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {sending && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '16px 16px 16px 2px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span className="animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%' }}></span>
                  <span className="animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.2s' }}></span>
                  <span className="animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.4s' }}></span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Calling tools...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions Panel */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button 
              onClick={() => handleSendMessage("Which accounts are currently at critical risk?")} 
              disabled={sending}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#3b82f6', e.currentTarget.style.color = 'white')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)', e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              ⚠️ Churn Risks
            </button>
            <button 
              onClick={() => handleSendMessage("Summarize support ticket issues across the portfolio")} 
              disabled={sending}
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#3b82f6', e.currentTarget.style.color = 'white')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)', e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              🎫 Ticket Summary
            </button>
          </div>

          {/* Chat Input form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Ask copilot anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={sending}
              style={{
                flexGrow: 1,
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              disabled={sending || !inputValue.trim()}
              style={{
                padding: '0.75rem 1.25rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: (sending || !inputValue.trim()) ? 0.5 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
      </>
      )}

      {activeTab === 'mcp' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Model Context Protocol (MCP) Server Hub</span>
              <span className="pulse-dot healthy"></span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.6' }}>
              Blueberry AI implements a fully compliant MCP Server at <code style={{ color: '#60a5fa', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>/api/mcp</code>.
              This interface allows external AI engines (such as Google Cloud Agent Builder) to query database indices, perform semantic lookups, and log customer health notes in real time.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '2.5rem' }}>
            {/* Tool list */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Registered MCP Tools</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mcpTools.map(tool => (
                  <div
                    key={tool.name}
                    onClick={() => {
                      setSelectedMcpTool(tool);
                      if (tool.name === 'getAccountContext' || tool.name === 'getAgentMemory') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002' }, null, 2));
                      } else if (tool.name === 'writeHealthNote') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002', noteText: 'CSM scheduled a follow-up review for Friday.', sentiment: 'Neutral' }, null, 2));
                      } else if (tool.name === 'searchIssues') {
                        setMcpArgs(JSON.stringify({ query: 'export crash', accountId: 'ACC-002' }, null, 2));
                      } else if (tool.name === 'writeAgentMemory') {
                        setMcpArgs(JSON.stringify({ accountId: 'ACC-002', content: 'Customer prefers morning calls.', category: 'preference' }, null, 2));
                      } else {
                        setMcpArgs('{}');
                      }
                    }}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: selectedMcpTool?.name === tool.name ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                      background: selectedMcpTool?.name === tool.name ? 'rgba(59, 130, 246, 0.03)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '1rem', color: selectedMcpTool?.name === tool.name ? '#60a5fa' : 'var(--text-primary)' }}>
                        {tool.name}
                      </strong>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                        tool
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Tool Console */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>MCP Execution Console</h3>
              {selectedMcpTool ? (
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Executing:</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: '#60a5fa', marginTop: '2px' }}>{selectedMcpTool.name}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Arguments JSON:</span>
                    <textarea
                      value={mcpArgs}
                      onChange={(e) => setMcpArgs(e.target.value)}
                      style={{
                        width: '100%',
                        height: '110px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#34d399',
                        fontFamily: 'Courier New, monospace',
                        fontSize: '0.85rem',
                        padding: '10px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button
                    onClick={runMcpTool}
                    disabled={mcpRunning}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: mcpRunning ? 0.6 : 1
                    }}
                  >
                    {mcpRunning ? 'Running tool...' : '🔌 Call Tool'}
                  </button>

                  {mcpResult && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Response Content:</span>
                      <pre style={{
                        width: '100%',
                        maxHeight: '220px',
                        overflow: 'auto',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontFamily: 'Courier New, monospace',
                        fontSize: '0.8rem',
                        padding: '12px',
                        margin: 0
                      }}>
                        {mcpResult}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select a tool from the left list to execute.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
