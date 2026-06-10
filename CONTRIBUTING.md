# Blueberry AI Architecture & Contribution Guide

Welcome to the Blueberry AI repository! This guide provides a rapid overview of the system architecture and codebase structure so you can navigate and evaluate the project efficiently.

## 🏗️ System Architecture

Blueberry AI is a unified Customer Success platform powered by **Elasticsearch** and **Google Cloud Agent Builder**. 

The system operates on a read-and-write paradigm:
1. **Frontend / Application Layer (Next.js):** Provides the UI for CSMs to view Account timelines, Churn Risk scores, and Pain-point clusters.
2. **Data Layer (Elasticsearch):** Stores all primary data:
   - `accounts` index: Core CRM data.
   - `tickets` index: Support tickets with priority and text.
   - `health_notes` index: CSM notes with sentiment analysis.
   - `call_transcripts` index: Transcripts of customer calls.
3. **Agentic Layer (MCP + Google Agent Builder):** 
   - A custom **Model Context Protocol (MCP)** bridge is hosted natively in Next.js (`/api/mcp`).
   - The Google Cloud Agent Builder securely connects to this MCP endpoint, gaining access to powerful **ES|QL** aggregation tools and semantic search capabilities.
   - The agent is not just read-only—it actively writes new milestones and escalations back into Elasticsearch.

## 📂 Codebase Navigation

The repository is a Next.js 14+ App Router project using TypeScript and TailwindCSS.

### Key Directories

- **`/src/app`**: Contains the Next.js App Router definitions.
  - `/src/app/page.tsx`: The main application shell and sidebar logic.
  - `/src/app/api/mcp`: The core Model Context Protocol (MCP) bridge that Google Agent Builder communicates with.
  - `/src/app/api/tools`: Individual API routes backing the MCP tools (e.g., dynamic ES|QL risk scoring, semantic search).

- **`/src/components`**: React UI components.
  - `RiskRadar.tsx`: The main dashboard view calculating and visualizing account risk.
  - `AccountTimeline.tsx`: The chronological view of a customer's history.
  - `CopilotAction.tsx`: The chat interface for the autonomous agent.

- **`/src/lib`**: Core utilities and backend services.
  - `elastic.ts`: Elasticsearch client initialization.
  - `tool-services.ts`: The heavy-lifting business logic. **This file contains the core ES|QL queries** that power the mathematical churn-risk models and semantic retrievals.

- **`/scripts`**: Automation and setup scripts.
  - `seed-data.ts`: The script to populate Elasticsearch with the initial mock dataset (Accounts, Tickets, Notes, Transcripts).

## 📊 The ES|QL Logic

We rely heavily on Elasticsearch Query Language (ES|QL) for real-time risk aggregation. Instead of fetching thousands of records to the client, the Next.js API uses ES|QL to compile ticket priorities and note sentiments natively in the database.

You can inspect these queries in `/src/lib/tool-services.ts` within the `getDynamicRiskScoreService` function.

## 🤝 How to Evaluate

If you are a judge evaluating this project:
1. Try the **Event Simulator** to ingest a new support ticket and see the ES|QL churn risk score dynamically update.
2. Interact with the **Blueberry Copilot** to see how the agent reasons over the data, retrieves the risk score, and executes multi-step escalations.
3. Check the **Advanced Settings > Model Context Protocol** tab to view live payload traces between the Google Agent and our Elastic MCP endpoint.

Thanks for reviewing our project!
