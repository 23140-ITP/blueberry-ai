import { SessionsClient } from '@google-cloud/dialogflow-cx';
import path from 'path';
import fs from 'fs';

// Automatically set GOOGLE_APPLICATION_CREDENTIALS if gcp-key.json is in the workspace root
const localKeyPath = path.resolve(process.cwd(), 'gcp-key.json');
if (fs.existsSync(localKeyPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
}

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'global';
const agentId = process.env.GCP_AGENT_ID;

let sessionClient: any = null;

export function getSessionClient() {
  if (!sessionClient) {
    if (!projectId || !agentId) {
      throw new Error('GCP_PROJECT_ID and GCP_AGENT_ID environment variables are required to query the Agent');
    }

    const apiEndpoint = location === 'global'
      ? 'global-dialogflow.googleapis.com'
      : `${location}-dialogflow.googleapis.com`;

    sessionClient = new SessionsClient({
      apiEndpoint,
    });
  }
  return sessionClient;
}

export async function sendMessageToAgent(sessionId: string, text: string, accountId?: string) {
  const client = getSessionClient();
  if (!projectId || !agentId) {
    throw new Error('GCP_PROJECT_ID and GCP_AGENT_ID are missing');
  }

  const sessionPath = client.projectLocationAgentSessionPath(
    projectId,
    location,
    agentId,
    sessionId
  );

  const request: any = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
      },
      languageCode: 'en',
    },
  };

  if (accountId) {
    request.queryParams = {
      parameters: {
        accountId
      }
    };
  }

  const [response] = await client.detectIntent(request);
  return response.queryResult;
}
