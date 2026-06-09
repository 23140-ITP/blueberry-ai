import { NextResponse } from 'next/server';
import { sendMessageToAgent } from '@/lib/google-agent';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId = `session-${Date.now()}`, accountId } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Check if configuration environment variables are set
    if (!process.env.GCP_PROJECT_ID || !process.env.GCP_AGENT_ID) {
      return NextResponse.json({
        response: "I'm sorry, but my Google Cloud Agent configuration is not complete. Please configure GCP_PROJECT_ID and GCP_AGENT_ID in the environment.",
        setupRequired: true
      });
    }

    const queryResult = await sendMessageToAgent(sessionId, message, accountId);

    // Extract text responses from responseMessages
    const textResponses = queryResult.responseMessages
      ?.filter((msg: any) => msg.text && msg.text.text)
      ?.map((msg: any) => msg.text.text.join('\n')) || [];

    const responseText = textResponses.join('\n\n') || "I received your request, but I couldn't formulate a text response.";

    return NextResponse.json({
      response: responseText,
      sessionId,
      parameters: queryResult.parameters,
      rawQueryResult: queryResult
    });

  } catch (error: any) {
    console.error('Error in agent chat endpoint:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      response: "An error occurred while communicating with the Google Cloud Agent. Please ensure your credentials and environment configuration are correct."
    }, { status: 500 });
  }
}
