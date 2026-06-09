# Blueberry AI

**B2B Customer Success Teams struggle to detect churn risks early because customer signals (support tickets, CSM notes, and call transcripts) are fragmented across different tools.**
Blueberry AI solves this by aggregating these signals into a unified timeline and proactively surfacing churn risk using advanced ES|QL and an autonomous agent that acts on your behalf.
**Architecture:** Google Cloud Agent Builder + Elastic Agent Builder MCP server + Elasticsearch Serverless.

---

## 🟢 Live Demo & Submission Details

- **Live Hosted App:** [https://blueberry-ai.run.app](https://blueberry-ai.run.app) *(Replace with actual hash URL)*
- **Demo Video (3 Min):** [Watch the Demo Flow on YouTube](https://youtube.com) *(Replace with actual video link)*
- **Hackathon Track:** Elastic
- **Demo Flow:** The agent retrieves a portfolio summary, runs an advanced ES|QL churn risk analysis on a specific account, and executes a multi-step escalation by drafting a Slack payload and writing the event back into Elasticsearch.

---

## 🏗️ System Architecture

![Architecture Diagram](./docs/architecture_diagram.png)

*Note: Google Cloud Agent Builder is configured to connect directly against the Elastic Agent Builder MCP endpoint. Our Next.js `/api/mcp` acts as a custom MCP bridge extending this functionality, empowering the agent with highly customized ES|QL retrieval and Elasticsearch write-back tools.*

---

## 🖼️ Application Views

### Risk Radar
![Risk Radar](./docs/risk_radar_ui.png)

### Chronological Account Timeline
![Account Timeline](./docs/account_timeline_ui.png)

### Agent Orchestration (Multi-step Action)
![Copilot Action](./docs/copilot_action_ui.png)

---

## 🏆 How this meets Hackathon Requirements

- **Uses Google Cloud Agent Builder:** Acts as the cognitive brain of the application, natively executing tools and reasoning over customer contexts.
- **Uses Elastic MCP Server:** Integrates through the Model Context Protocol to seamlessly provide tools to the Google Agent.
- **Performs Multi-Step Tasks:** Moves beyond simple chat by retrieving contexts, computing ES|QL mathematical risk scores, and generating escalation payloads in a single user command.
- **Hosted Publicly:** Continuously deployed on Google Cloud Run.
- **Open-Source Licensed:** Released under the MIT License.

---

## 🔍 Why Elastic?

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
