# Blueberry AI — Customer Retention Copilot

Blueberry AI is a premium generative customer retention dashboard designed to turn scattered customer signals into faster, coordinated action. It is built for the **Google Cloud Rapid Agent Hackathon (Elastic Track)**.

The system orchestrates a **Google Cloud Agent Builder (Dialogflow CX)** generative agent as the brain, connected to **Elasticsearch Serverless** via custom API tools, serving a gorgeous client-facing Next.js dashboard.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  BLUEBERRY AI DASHBOARD              │
│               (Next.js App Router + CSS)            │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Account View │  │ Risk Radar   │  │ Agent Chat  │ │
│  │ (Detail)     │  │ (Overview)   │  │ (Actions)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND API (Next.js API Routes)        │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │      Google Cloud Agent Builder Integration      │ │
│  │     (Communicates via Dialogflow CX SDK)        │ │
│  └─────────────────────┬───────────────────────────┘ │
└─────────────────────────┼────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│        GOOGLE CLOUD AGENT BUILDER (The Brain)        │
│                                                     │
│  Tools configured in Agent Builder:                   │
│  • getAccountContext (via OpenAPI spec)              │
│  • searchIssues (via OpenAPI spec)                   │
│  • writeHealthNote (via OpenAPI spec)                │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│          ELASTIC CLOUD SERVERLESS                    │
│                                                     │
│  Indices:                                             │
│  • accounts          • tickets (semantic_text)       │
│  • call_transcripts  • health_notes (semantic_text)  │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Retention Radar Overview**: Live analysis of your customer portfolio health metrics: Total ARR under management, at-risk accounts, and average health score.
2. **Unified Chronological Customer Journey**: Merges support tickets, CSM check-ins, and call transcripts from separate Elasticsearch indices into a single, cohesive timeline sorted by date.
3. **Blueberry Copilot (GenAI Agent)**: A sidebar chat widget that lets you talk directly to the GCP Agent. The agent queries your database semantically (using Elasticsearch `semantic_text` match queries) and summarizes recent complaints or VP phone calls.
4. **Actionable Operations**: Write escalation logs and notes back to Elasticsearch indices in real-time, automatically updating the CRM timeline.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js (App Router, React 19, TypeScript)
* **Styling:** Vanilla CSS (curated deep slate glassmorphism theme, custom SVG graphs, and micro-animations)
* **Database:** Elasticsearch Serverless (with `semantic_text` mapping for AI-driven semantic queries)
* **AI Orchestrator:** Google Cloud Agent Builder / Dialogflow CX
* **Deployment:** Docker, Google Cloud Run

---

## 🚀 Getting Started

### 1. Prerequisite Environment Variables
Create a `.env` file in the root of the project with the following:
```env
ELASTIC_URL="https://your-elasticsearch-endpoint"
ELASTIC_API_KEY="your-elastic-api-key"
GCP_PROJECT_ID="your-gcp-project-id"
GCP_AGENT_ID="your-agent-id"
GCP_LOCATION="us-central1" # or 'global'
```

### 2. Database Seeding
Index the mockup customer accounts, call logs, tickets, and health notes into Elasticsearch:
```bash
npm run seed
```
*(This deletes old indices, creates mappings with `semantic_text` fields, and inserts mock accounts like TechFlow ACC-002, Acme Corp ACC-001).*

### 3. Google Cloud Credentials
Download a service account JSON key from Google Cloud Console with the **Dialogflow API Admin** role. Rename it to `gcp-key.json` and place it in the root folder of this project.

### 4. Local Run & Cloud Run Connection
Start the development server:
```bash
npm run dev
```

**MCP Server Connection:**
Since the app is already deployed to Google Cloud Run, your Agent Builder should be configured to connect directly to the live MCP endpoint:
`https://blueberry-ai-<hash>.run.app/api/mcp`

Configure this URL in the Dialogflow CX / Agent Builder Tool settings.

---

## 🐳 Docker & Cloud Run Deployment

To deploy this application to Google Cloud Run, build and deploy the container directly from source:

```bash
gcloud run deploy blueberry-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ELASTIC_URL="your-url",ELASTIC_API_KEY="your-key",GCP_PROJECT_ID="your-project",GCP_AGENT_ID="your-agent",GCP_LOCATION="us-central1"
```

*Note: When deployed on Google Cloud Run, the application uses the Cloud Run Service Account credentials automatically, meaning `gcp-key.json` is not required in production.*

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
