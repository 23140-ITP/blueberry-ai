import Link from 'next/link';
import { ArrowRight, Bot, Database, Zap, CheckCircle2, ShieldAlert, LineChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 font-sans">
      {/* Navbar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Blueberry AI</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-foreground transition-colors">Our Solution</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/demo" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Try a Demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 animate-fade-in">
            <Zap className="h-3.5 w-3.5" />
            Built for the Elastic Hackathon
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
            Proactive Customer <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Success Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
            Blueberry AI aggregates fragmented customer signals to surface churn risks instantly using advanced ES|QL and an autonomous agent—without the manual data entry.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Link 
              href="/demo" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              Try a Live Demo <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="https://github.com/23140-ITP/blueberry-ai" 
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-bold text-lg transition-all flex items-center gap-2"
            >
              View on GitHub
            </a>
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="rounded-xl overflow-hidden border border-border shadow-2xl bg-zinc-950 p-2">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="p-8 bg-zinc-950 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-red-400" />
                    <h3 className="text-xl font-bold text-zinc-100">ACC-002 • Critical Churn Risk Detected</h3>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400">
                    <span className="text-blue-400">GET</span> _msearch<br/>
                    {`{"index":"tickets"}`}<br/>
                    {`{"query":{"bool":{"must":[{"match":{"account_id":"ACC-002"}},{"match":{"priority":"High"}}]}}}`}<br/>
                    <br/>
                    <span className="text-emerald-400">// ES|QL Aggregation complete. Risk Score: 0.94</span>
                  </div>
                </div>
                <div className="p-5 rounded-lg bg-blue-900/10 border border-blue-500/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Bot className="h-4 w-4" /> Agent Action Executed
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Automatically retrieved context, computed mathematical risk via ES|QL, and generated an escalation payload for the CSM team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Legacy CS platforms are static and fragmented.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl">The current way Customer Success Managers identify churn is broken.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-background border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                  <Database className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Scattered Signals</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Crucial telemetry is fragmented across Zendesk support tickets, Salesforce CRM notes, and Gong call transcripts, making a unified timeline impossible.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Hidden Indicators</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  CSMs miss critical churn indicators hiding in unstructured text or deeply nested semantic context until the customer has already decided to leave.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                  <LineChart className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Read-Only Platforms</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Current tools are strictly read-only, requiring immense manual intervention to map fragmented data and escalate issues to engineering or leadership.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">An Autonomous, Context-Aware Copilot</h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Blueberry AI isn't just a dashboard; it's an intelligent layer powered by the Elastic Model Context Protocol (MCP) and Google Agent Builder.
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Aggregates Signals</h4>
                      <p className="text-sm text-muted-foreground mt-1">Pulls fragmented customer data into one semantic timeline natively stored in Elasticsearch.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Dynamic ES|QL Risk Scoring</h4>
                      <p className="text-sm text-muted-foreground mt-1">Instantaneously computes mathematical churn-risk models by piping ticket volumes and sentiment directly through ES|QL.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Autonomous Escalation</h4>
                      <p className="text-sm text-muted-foreground mt-1">Reads contexts, reasons over risk, drafts Slack payloads, and writes events back into Elasticsearch.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-[80px]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">ES|QL Power in Action</h3>
                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 font-mono text-sm leading-loose overflow-x-auto text-zinc-300">
                  <span className="text-blue-400">FROM</span> tickets <br/>
                  <span className="text-purple-400">|</span> <span className="text-blue-400">WHERE</span> account_id == "ACC-002" <br/>
                  &nbsp;&nbsp;<span className="text-blue-400">AND</span> status == "Open" <br/>
                  <span className="text-purple-400">|</span> <span className="text-blue-400">STATS</span> count(ticket_id) <span className="text-blue-400">BY</span> priority <br/>
                  <span className="text-purple-400">|</span> <span className="text-blue-400">EVAL</span> risk_weight = <span className="text-amber-300">case</span>(priority == "High", 3.0, 1.0)<br/>
                  <br/>
                  <span className="text-emerald-500">// Native execution slashes latency by 90%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / How It Works */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">How Blueberry AI Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-emerald-500/0" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl shadow-blue-900/20 mb-6">
                  <span className="text-2xl font-black text-blue-500">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Retrieve Context</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  The Google Agent Builder connects to our custom Elastic MCP bridge, semantically searching support tickets, transcripts, and notes.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl shadow-blue-900/20 mb-6">
                  <span className="text-2xl font-black text-blue-500">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Compute Risk</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Raw metrics are piped directly through the Elasticsearch query engine using ES|QL to compile an instantaneous mathematical risk score.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl shadow-emerald-900/20 mb-6">
                  <span className="text-2xl font-black text-emerald-500">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Execute Escalation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  The agent doesn't just read—it writes. It automatically generates an escalation payload and logs the memory back into Elasticsearch.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-8">Why not Gainsight or ChurnZero?</h2>
            <div className="p-8 rounded-2xl bg-card border border-border shadow-lg text-left">
              <p className="text-muted-foreground leading-relaxed mb-6">
                While traditional platforms rely on static rule engines and are strictly <strong>read-only</strong>, Blueberry AI flips the paradigm. We utilize the Model Context Protocol (MCP) to provide an autonomous agent with <strong>read-and-write</strong> capabilities. 
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We don't just show you a dashboard of problems; our Copilot actively searches historical resolutions via ELSER semantic search, calculates the exact impact, and acts on your behalf to retain revenue.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-blue-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/50 to-blue-900/80" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Stop guessing about churn.</h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
              Experience the power of Elastic Serverless, ES|QL, and Google Agent Builder today.
            </p>
            <Link 
              href="/demo" 
              className="inline-flex px-10 py-5 bg-white text-blue-900 hover:bg-zinc-100 rounded-xl font-bold text-xl transition-all hover:scale-105 items-center gap-3 shadow-2xl"
            >
              Try the Live Demo <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <span className="font-bold text-foreground">Blueberry AI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Built for the <a href="https://devpost.com" className="text-foreground hover:underline">Elastic AI Hackathon</a> • Open Source under MIT
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <a href="https://github.com/23140-ITP/blueberry-ai" className="hover:text-foreground transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
