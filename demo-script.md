# Blueberry AI - Hackathon Demo Script

This script outlines a 3-minute video recording scenario demonstrating the core requirements: **Retrieval, Reasoning, and Action** orchestrated by Google Agent Builder and Elastic's ES|QL natively connected via MCP.

---

### Setup
1. Have the Blueberry AI dashboard open on the `Copilot` tab.
2. Ensure the demo database is freshly seeded (you can click the `Reset Data` button in the UI).
3. Start recording your screen.

---

### Part 1: Context & Retrieval (0:00 - 1:00)

**Speaker Track:**
"Hi, I'm excited to show you Blueberry AI, our proactive customer retention platform. It leverages Google Agent Builder as the central brain, connected directly to Elasticsearch Serverless using the Model Context Protocol (MCP)."

**Action:**
Type in the Copilot chat: 
> *"Give me a quick portfolio summary of our accounts right now. Which ones should I be worried about?"*

**Speaker Track:**
"Here, the Google Agent autonomously triggers the `getPortfolioSummary` MCP tool. It queries Elasticsearch and sees that TechFlow (ACC-002) is at a warning stage with significant ARR at risk."

---

### Part 2: Advanced Reasoning with ES|QL (1:00 - 2:00)

**Speaker Track:**
"I want to dig deeper into TechFlow using our custom Churn Risk engine. This engine doesn't just do basic searches—it uses Elastic's ES|QL to pipe and correlate support ticket volumes, priority metrics, and CSM health note sentiment analysis dynamically."

**Action:**
Type in the Copilot chat:
> *"Run a churn risk analysis on TechFlow (ACC-002)."*

**Speaker Track:**
"The Agent triggers the `detectChurnRisk` tool over MCP. The Next.js backend executes the ES|QL query against Elastic and returns the exact mathematical factors driving the risk. The Agent then reasons over these factors, determining that the high volume of urgent tickets and negative health notes require immediate intervention."

---

### Part 3: Action & Escalation (2:00 - 3:00)

**Speaker Track:**
"Finally, we need to take action. Blueberry AI isn't just read-only. Our Agent can orchestrate complex workflows by writing back to Elasticsearch."

**Action:**
Type in the Copilot chat:
> *"This is critical. Trigger an emergency escalation for TechFlow. Write it to their account."*

**Speaker Track:**
"The Agent uses the `escalateAccount` MCP tool. This tool updates the Elasticsearch document, automatically changing their status to Critical. It also generates an emergency Slack Block Kit payload and an email draft for the VP of Customer Success."

**Action:**
*Navigate to the TechFlow account detail page (click ACC-002 in the sidebar or list).*

**Speaker Track:**
"If we look at the TechFlow dashboard, we can see the risk score has spiked, and the escalation event has been seamlessly inserted into the chronological customer journey timeline alongside their support tickets and call transcripts. Thanks for watching!"
