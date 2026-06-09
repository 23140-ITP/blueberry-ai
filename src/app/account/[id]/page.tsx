"use client";

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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
  
  const [account, setAccount] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agent Memory Bank states
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('preference');
  const [addingMemory, setAddingMemory] = useState(false);

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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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

  // Send message to agent
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message to UI
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
          sessionId,
          accountId,
          companyName: account?.company_name
        })
      });

      const data = await res.json();
      
      // Add agent message to UI
      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: data.response || "I received your message but could not generate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);

      // If the agent updated any notes, reload timeline to show it instantly!
      if (textToSend.toLowerCase().includes('log') || textToSend.toLowerCase().includes('note') || textToSend.toLowerCase().includes('escalat')) {
        setTimeout(fetchData, 2000); // give Elasticsearch a small window to refresh indices
      }

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

  // Helper styles for risk levels
  const riskScore = account ? Math.round(account.risk_score * 100) : 0;
  const isCritical = riskScore >= 75;
  const isWarning = riskScore >= 25 && riskScore < 75;
  const healthClass = isCritical ? 'critical' : isWarning ? 'at-risk' : 'healthy';
  const healthColor = isCritical ? '#f87171' : isWarning ? '#fbbf24' : '#34d399';

  return (
    <div style={{ padding: '2rem', maxWidth: '1450px', margin: '0 auto', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/">
          <span style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ← Back to Retention Radar
          </span>
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <span className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Loading customer account details...</span>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ color: 'var(--danger)' }}>An Error Occurred</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link href="/">
            <button style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Go Back</button>
          </Link>
        </div>
      ) : (
        /* Main Layout Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flexGrow: 1 }}>
          
          {/* Left Column: Details & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Account Info Header */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{account.company_name}</h1>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Account ID: <strong>{account.account_id}</strong> • Industry: {account.industry}
                </span>
                
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Annual Recurring Revenue</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${account.arr.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Last Contact Date</span>
                    <span style={{ fontSize: '1.1rem' }}>{new Date(account.last_contact_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              </div>

              {/* Glowing circular health meter */}
              <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="100" height="100" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={healthColor} strokeWidth="3.5" 
                    strokeDasharray={`${riskScore} ${100 - riskScore}`} strokeDashoffset="25"
                    style={{ transition: 'stroke-dasharray 0.5s ease', transformOrigin: 'center' }} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: healthColor }}>{riskScore}%</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk</span>
                </div>
              </div>
            </div>

            {/* Agent Memory Bank */}
            <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <span>🧠 Agent Memory Bank</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Elastic Managed Memory</span>
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{memories.length} facts remembered</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Long-term facts, preferences, and context cached by the copilot in the <code style={{ color: '#60a5fa' }}>agent_memory</code> index.
              </p>

              {/* Memory List */}
              {memories.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  No memories cached for this account. Teach the agent via chat, or log a memory below!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {memories.map((mem) => (
                    <div key={mem.memory_id || mem.created_at} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: mem.category === 'preference' ? '#fbbf24' : mem.category === 'escalation' ? '#f87171' : '#60a5fa'
                        }}>
                          {mem.category}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(mem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                        {mem.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Memory Form */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="preference">Preference</option>
                  <option value="escalation">Escalation</option>
                  <option value="milestone">Milestone</option>
                </select>
                <input
                  type="text"
                  placeholder="Remember a new customer fact or preference..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  style={{
                    flexGrow: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
                <button
                  onClick={handleSaveMemory}
                  disabled={addingMemory || !newMemoryText.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    opacity: (addingMemory || !newMemoryText.trim()) ? 0.5 : 1
                  }}
                >
                  {addingMemory ? 'Saving...' : 'Remember'}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Customer Journey Timeline</h2>
              
              {timeline.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No customer activity or tickets logged yet.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  {timeline.map((item, idx) => {
                    let typeColor = '#3b82f6'; // Blue for call
                    let typeIcon = '📞';
                    if (item.type === 'ticket') {
                      typeColor = item.priority === 'Urgent' ? '#ef4444' : item.priority === 'High' ? '#f59e0b' : '#3b82f6';
                      typeIcon = '🎫';
                    } else if (item.type === 'note') {
                      typeColor = item.sentiment === 'Negative' ? '#ef4444' : item.sentiment === 'Positive' ? '#10b981' : '#f59e0b';
                      typeIcon = '📝';
                    }

                    return (
                      <div key={item.id} className="glass-panel animate-fade-in" style={{
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        position: 'relative',
                        animationDelay: `${idx * 0.1}s`
                      }}>
                        {/* Timeline Node Connector Circle */}
                        <div style={{
                          position: 'absolute',
                          left: '-2.1rem',
                          top: '1.5rem',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-main)',
                          border: `3px solid ${typeColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 10px ${typeColor}40`
                        }}></div>

                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '1.05rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <span>{typeIcon}</span> {item.title}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              {new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          
                          {/* Badges depending on item type */}
                          {item.type === 'ticket' && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: item.priority === 'Urgent' ? 'var(--danger-glow)' : 'rgba(255,255,255,0.05)',
                              color: item.priority === 'Urgent' ? '#f87171' : 'var(--text-secondary)',
                              border: item.priority === 'Urgent' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {item.priority} Priority
                            </span>
                          )}
                          {item.type === 'note' && (
                            <span className={`risk-badge ${item.sentiment === 'Negative' ? 'critical' : item.sentiment === 'Positive' ? 'healthy' : 'at-risk'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              {item.sentiment} Sentiment
                            </span>
                          )}
                          {item.type === 'call' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ⏱ {item.duration} mins
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
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
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'sticky', top: '2rem', overflow: 'hidden' }}>
            {/* Chat Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`pulse-dot ${healthClass}`}></span>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>Blueberry Copilot</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected to Google Cloud Agent Builder</span>
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
                onClick={() => handleSendMessage("Why is this account at risk?")} 
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
                ❓ Why at risk?
              </button>
              <button 
                onClick={() => handleSendMessage("Search for support issues in this account")} 
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
                🔍 Search tickets
              </button>
              <button 
                onClick={() => handleSendMessage(`Log a new health note: 'Reviewed ${account?.company_name || 'customer'} support tickets and assigned an escalation owner to patch issues.'`)} 
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
                ✍ Log CSM update
              </button>
            </div>

            {/* Chat Input form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ask your copilot anything..."
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
      )}
    </div>
  );
}
