import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Brain, BrainCircuit, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export function CopilotAction() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'agent', text: "Hello! I am your Blueberry Copilot. Ask me anything about your customer accounts, recent calls, or churn risks.", timestamp: '' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(`session-${Date.now()}`);
    setMessages(prev => [
      {
        ...prev[0],
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in">
      <div className="bg-background border border-border rounded-xl flex flex-col h-[650px] overflow-hidden shadow-sm">
        
        {/* Chat Header */}
        <div className="p-4.5 border-b border-border flex items-center gap-2.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_#10b981]"></span>
          <div>
            <h2 className="text-xs font-bold text-foreground">Blueberry Copilot Workspace</h2>
            <span className="text-[10px] text-muted-foreground">Connected to Dialogflow CX Google Cloud Agent</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-card/10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.sender === 'user' ? 'bg-blue-600/20 text-blue-500' : 'bg-indigo-600/20 text-indigo-500'
              }`}>
                {msg.sender === 'user' ? <Terminal className="w-3.5 h-3.5" /> : <BrainCircuit className="w-3.5 h-3.5" />}
              </div>
              <div className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {msg.sender === 'user' ? 'You' : 'Blueberry AI Agent'}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">{msg.timestamp}</span>
                </div>
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-card border border-border text-foreground rounded-tl-sm prose prose-sm dark:prose-invert max-w-none'
                }`}>
                  {msg.sender === 'agent' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-blue-400" {...props} />
                    }}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-500 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blueberry AI Agent</span>
                <div className="p-3.5 rounded-xl text-xs bg-card border border-border rounded-tl-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/30">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Blueberry Copilot to review TechFlow's recent tickets..."
                className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                disabled={sending}
              />
            </div>
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button onClick={() => handleSendMessage("Which accounts are currently at critical risk?")} className="shrink-0 text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap transition">Who is at critical risk?</button>
            <button onClick={() => handleSendMessage("Draft a Slack escalation for ACC-002")} className="shrink-0 text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap transition">Escalate TechFlow (ACC-002)</button>
            <button onClick={() => handleSendMessage("Reset the demo database to default state")} className="shrink-0 text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap transition border border-red-500/20 hover:border-red-500/40">Reset Demo Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
