import { Client } from '@elastic/elasticsearch';
import { AgentsClient } from '@google-cloud/dialogflow-cx';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Setup GCP application credentials
const localKeyPath = path.resolve(process.cwd(), 'gcp-key.json');
if (fs.existsSync(localKeyPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
}

async function testElastic() {
  console.log('=== ELASTICSEARCH DIAGNOSTICS ===');
  const url = process.env.ELASTIC_URL;
  const apiKey = process.env.ELASTIC_API_KEY;
  if (!url || !apiKey) {
    console.log('Elastic credentials missing in .env');
    return;
  }

  const client = new Client({
    node: url,
    auth: { apiKey }
  });

  try {
    const info = await client.info();
    console.log(`Successfully connected to Elasticsearch cluster!`);
    console.log(`- Cluster Name: ${info.cluster_name}`);
    console.log(`- Version: ${info.version.number}`);

    const indices = await client.cat.indices({ format: 'json' });
    console.log('\nActive Indices on Cluster:');
    indices.forEach((ind: any) => {
      console.log(`- ${ind.index} (${ind['docs.count']} docs, ${ind['store.size']})`);
    });

    console.log('\nRetrieving agent_memory mapping:');
    const mapping = await client.indices.getMapping({ index: 'agent_memory' });
    console.log(JSON.stringify(mapping['agent_memory']?.mappings, null, 2));

    console.log('\nChecking active Inference Models:');
    try {
      const inferenceModels: any = await client.transport.request({
        method: 'GET',
        path: '/_inference'
      });
      console.log(JSON.stringify(inferenceModels, null, 2));
    } catch (e) {
      console.log('No inference models found or _inference call not supported:');
      console.log((e as Error).message);
    }

  } catch (err) {
    console.error('Elasticsearch error:', err);
  }
}

async function testGCP() {
  console.log('\n=== GOOGLE CLOUD PLATFORM DIAGNOSTICS ===');
  const projectId = process.env.GCP_PROJECT_ID;
  const agentId = process.env.GCP_AGENT_ID;
  const location = process.env.GCP_LOCATION || 'global';

  if (!projectId || !agentId) {
    console.log('GCP credentials missing in .env');
    return;
  }

  try {
    const apiEndpoint = location === 'global'
      ? 'global-dialogflow.googleapis.com'
      : `${location}-dialogflow.googleapis.com`;

    const client = new AgentsClient({ apiEndpoint });
    const agentPath = client.agentPath(projectId, location, agentId);
    const [agent] = await client.getAgent({ name: agentPath });

    console.log(`Successfully connected to GCP Agent Builder!`);
    console.log(`- Agent Display Name: ${agent.displayName}`);
    console.log(`- Description: ${agent.description}`);
    console.log(`- Default Language: ${agent.defaultLanguageCode}`);
    console.log(`- Time Zone: ${agent.timeZone}`);
  } catch (err) {
    console.error('GCP / Dialogflow CX error:', err);
  }
}

async function main() {
  await testElastic();
  await testGCP();
}

main();
