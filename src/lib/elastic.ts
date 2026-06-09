import { Client } from '@elastic/elasticsearch';

let client: Client | null = null;

export function getElasticClient() {
  if (!client) {
    const url = process.env.ELASTIC_URL;
    const apiKey = process.env.ELASTIC_API_KEY;

    if (!url || !apiKey) {
      throw new Error('ELASTIC_URL and ELASTIC_API_KEY environment variables are required');
    }

    client = new Client({
      node: url,
      auth: {
        apiKey,
      },
    });
  }
  return client;
}
