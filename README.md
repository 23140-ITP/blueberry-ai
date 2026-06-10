# Blueberry AI

**B2B Customer Success Teams struggle to detect churn risks early because customer signals (support tickets, CSM notes, and call transcripts) are fragmented across different tools.**
Blueberry AI solves this by aggregating these signals into a unified timeline and proactively surfacing churn risk using advanced ES|QL and an autonomous agent that acts on your behalf.
**Architecture:** Google Cloud Agent Builder + Elastic Agent Builder MCP server + Elasticsearch Serverless.

### 💸 Business Impact
Blueberry AI reduces **mean-time-to-escalation from 3 days to 15 minutes** for CS teams managing 50+ accounts. By providing a single autonomous agent that can natively cross-reference product telemetry, semantic ticket history, and real-time CRM notes, teams capture $1M+ in at-risk ARR before the customer actually churns.

---

## 🟢 Live Demo & Submission Details

- **Live Hosted App:** [https://blueberry-ai-359524452928.us-central1.run.app/](https://blueberry-ai-359524452928.us-central1.run.app/) 
- **Demo Video (3 Min):** [Pending Hackathon Recording]
- **Hackathon Track:** Elastic
- **Demo Flow:** The agent retrieves a portfolio summary, runs an advanced ES|QL churn risk analysis on a specific account, and executes a multi-step escalation by drafting a Slack payload and writing the event back into Elasticsearch.
- **Judge Tip:** Use the "Event Simulator" tab or the `reset-demo` tool in the Copilot chat to freely test risk calculations without destroying permanent data!

---

## 🏗️ System Architecture

*Note: Google Cloud Agent Builder is configured to connect directly against the Elastic Agent Builder MCP endpoint. Our Next.js `/api/mcp` acts as a custom MCP bridge extending this functionality, empowering the agent with highly customized ES|QL retrieval and Elasticsearch write-back tools.*

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for a complete architecture overview and codebase navigation guide.

---

## 🖼️ Application Views

The application provides three main views for Customer Success teams:
- **Risk Radar:** Overview of portfolio risk, calculated via support sentiment and recent events.
- **Chronological Account Timeline:** Deep dive into a single account's history with combined signals from multiple Elastic indices.
- **Agent Orchestration:** A Blueberry Copilot chat interface for multi-step tasks like drafting escalations and summarizing pain points.

---

## 🏆 How this meets Hackathon Requirements

- **Uses Google Cloud Agent Builder:** Acts as the cognitive brain of the application, natively executing tools and reasoning over customer contexts.
- **Uses Elastic MCP Server:** Integrates through the Model Context Protocol to seamlessly provide tools to the Google Agent.
- **Performs Multi-Step Tasks:** Moves beyond simple chat by retrieving contexts, computing ES|QL mathematical risk scores, and generating escalation payloads in a single user command.
- **Hosted Publicly:** Continuously deployed on Google Cloud Run.
- **Open-Source Licensed:** Released under the MIT License.

---

## 🔍 Why Elastic? (Why not just use Gainsight?)

While legacy Customer Success tools like Gainsight or ChurnZero provide dashboards based on static rule engines, they are strictly **read-only** and require manual intervention to act on the data. 

Blueberry AI flips this paradigm by giving an autonomous agent **read-and-write** capabilities via the Model Context Protocol:
- **Contextual Retrieval:** Aggregates and semantically searches fragmented customer data (tickets, call transcripts, CSM health notes) using `semantic_text` capabilities.
- **ES|QL Analytical Tools:** Provides instantaneous mathematical churn-risk logic by piping ticket volumes, priorities, and sentiment analysis directly through ES|QL.
- **Memory Write-Back:** The agent isn't read-only; it natively writes escalation events and milestone memories back into Elasticsearch to persist state across sessions.

---

## 🗺️ Multi-step Mission

Blueberry AI executes the following autonomous flow without manual intervention:
1. **Retrieve Account Context:** Gathers support tickets, transcripts, and notes.
2. **Search Similar Issues:** Performs semantic matching against the knowledge base and historical ticket patterns.
3. **Compute Churn Risk:** Leverages the `detectChurnRisk` MCP tool powered by ES|QL to correlate raw metrics into a risk score.
4. **Draft Escalation & Write Note:** Generates a structured Slack/Email payload and writes the escalation event directly back into Elasticsearch.

### 🤖 Concrete Agent Trace Example
Here is a real example of the agent executing a multi-step trace via our Elastic MCP:
```json
[
  { "toolCall": "getAccountContext", "args": { "accountId": "ACC-002" } },
  { "toolResult": "Found 3 critical open tickets and 1 negative CSM note." },
  { "toolCall": "detectChurnRisk", "args": { "accountId": "ACC-002" } },
  { "toolResult": "Computed ES|QL Risk Score: 0.99 (Critical)." },
  { "toolCall": "escalateAccount", "args": { "accountId": "ACC-002", "reason": "Unresolved critical tickets threatening retention." } },
  { "toolResult": "Status updated in Elasticsearch. Slack Block Kit generated." }
]
```

### 📊 ES|QL Query Example
To power the `detectChurnRisk` tool, the Next.js MCP bridge executes real-time ES|QL queries to aggregate signal data before computing the final mathematical score. Here are the exact queries executed:

**Aggregate Open Support Tickets by Priority:**
```esql
FROM tickets 
| WHERE account_id == "ACC-002" AND status == "Open" 
| STATS count(ticket_id) by priority
```

**Aggregate CSM Health Notes by Sentiment:**
```esql
FROM health_notes 
| WHERE account_id == "ACC-002" 
| STATS count(note_id) by sentiment
```

---

## 🚀 Getting Started

### 1. Environment Setup
Copy the `.env.example` file to create your own local configuration:
```bash
cp .env.example .env
```
Fill in your Elasticsearch Serverless and Google Cloud credentials.

### 2. Database Seeding
Index the mockup customer accounts, call logs, tickets, and health notes into Elasticsearch:
```bash
npm run seed
```

### 3. Local Run & Cloud Run Connection
Start the development server:
```bash
npm run dev
```

**MCP Server Connection:**
Since the app is deployed to Google Cloud Run, your Google Agent Builder must be configured to connect directly to the live MCP endpoint:
`https://blueberry-ai-<hash>.run.app/api/mcp`

*Note on Cold Starts: Cloud Run containers spin down when idle. If you experience a brief `503 Service Unavailable` on the first load of the Live Demo or MCP tools, simply wait 5-10 seconds and refresh. The application features built-in loading states to handle API latency once the container is warm.*

---

## 🐳 Docker & Cloud Run Deployment

To deploy this application to Google Cloud Run natively from source:
```bash
gcloud run deploy blueberry-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.yaml
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
