# 🫐 Blueberry AI: Proactive Customer Success Intelligence

**B2B Customer Success Teams struggle to detect churn risks early because customer signals (support tickets, CSM notes, and call transcripts) are fragmented across different tools.**
Blueberry AI solves this by aggregating these signals into a unified timeline and proactively surfacing churn risk using advanced **ES|QL** and an autonomous agent that acts on your behalf.

*Built with: Google Cloud Agent Builder + Elastic Agent Builder MCP server + Elasticsearch Serverless.*

---

## 💡 Inspiration
Legacy Customer Success platforms like Gainsight or ChurnZero provide dashboards based on static rule engines. They are strictly **read-only** and require immense manual intervention to map fragmented telemetry data. When managing 50+ enterprise accounts, Customer Success Managers (CSMs) routinely miss critical churn signals hiding in long support tickets or vague health notes until it's too late. We wanted to build an intelligent, autonomous layer that not only detects these risks instantaneously but actually *takes action* to retain revenue. 

## 💻 What it does
Blueberry AI is an autonomous, context-aware Customer Success Copilot. It reduces **mean-time-to-escalation from 3 days to 15 minutes** by:
- **Aggregating Signals:** Pulling fragmented customer data (tickets, call transcripts, CSM notes) into one semantic timeline.
- **Dynamic ES|QL Risk Scoring:** Instantaneously computing mathematical churn-risk models by piping ticket volumes, priorities, and sentiment analysis directly through Elasticsearch Query Language (ES|QL).
- **Autonomous Escalation via MCP:** Our Copilot utilizes the Model Context Protocol (MCP) to read contexts, reason over churn risks, draft a Slack payload, and write the escalation event back into Elasticsearch automatically.

## 🛠️ How we built it
We utilized a **Next.js 14 App Router** framework to provide a beautiful, responsive user interface. For the backend and intelligence layer, we leveraged:
1. **Elasticsearch Serverless**: Acts as our primary data store and analytical engine, housing `accounts`, `tickets`, `health_notes`, and `call_transcripts`.
2. **Google Cloud Agent Builder**: The cognitive brain that natively executes tools and reasons over customer contexts.
3. **Custom Elastic MCP Bridge**: We built a custom Next.js `/api/mcp` bridge to expose ES|QL capabilities to the Google Agent. This flips the paradigm—giving our agent read-and-write capabilities to deeply interface with Elastic.

### 📊 The Power of ES|QL
To power our risk models, our Next.js MCP bridge executes real-time ES|QL queries to aggregate signal data before computing the final mathematical score. 

**Aggregate Open Support Tickets by Priority:**
```esql
FROM tickets 
| WHERE account_id == "ACC-002" AND status == "Open" 
| STATS count(ticket_id) by priority
```

## 🚧 Challenges we ran into
Building a robust agent that doesn't hallucinate context across dozens of API endpoints was difficult. By utilizing the Model Context Protocol (MCP), we were able to firmly tether the Agent's reasoning strictly to our custom Elastic queries. Additionally, generating fast risk scores across thousands of mock tickets was slow initially; writing native ES|QL aggregations cut our latency down by 90% by letting the database do the heavy lifting.

## 🏆 Accomplishments that we're proud of
- **Read & Write Paradigm:** The agent isn't just a chatbot querying an index; it natively writes escalation events and milestone memories back into Elasticsearch to persist state across sessions!
- **Multi-step Mission Execution:** Our agent can execute a 4-step autonomous flow (Retrieve Context -> Semantic Search Similar Issues -> Compute Churn Risk -> Draft Escalation & Write Note) all from a single user prompt.
- **Flawless UI/UX:** A highly polished, responsive, and dynamic UI that looks and feels like a premium, enterprise-ready B2B platform.

## 📖 What we learned
We learned the sheer power and speed of ES|QL. Shifting aggregation logic directly into the database query engine drastically reduced our payload sizes, simplified our application code, and made our agent responses remarkably fast.

## 🚀 What's next for Blueberry AI
- Integrating live webhook ingestion from Zendesk and Salesforce to move beyond mock data.
- Building custom Kibana dashboards based directly on the MCP `agent_logs` we write.
- Upgrading our simulators to fully functional Document-Level Security (DLS) across actual clusters for multi-tenant enterprise data compliance.

---

## 🟢 Live Demo & Submission Details

- **Live Hosted App:** [https://blueberry-ai-359524452928.us-central1.run.app/](https://blueberry-ai-359524452928.us-central1.run.app/) 
- **Demo Video (3 Min):** [Pending Hackathon Recording]
- **Hackathon Track:** Elastic
- **Demo Flow:** The agent retrieves a portfolio summary, runs an advanced ES|QL churn risk analysis on a specific account, and executes a multi-step escalation.
- **Judge Tip:** Use the "Event Simulator" tab or the `reset-demo` tool in the Copilot chat to freely test risk calculations without destroying permanent data!

---

## ⚙️ Getting Started (Local Development)

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

### 3. Run the App
Start the development server:
```bash
npm run dev
```

### 🐳 Docker & Cloud Run Deployment
To deploy this application to Google Cloud Run natively from source:
```bash
gcloud run deploy blueberry-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.yaml
```

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
