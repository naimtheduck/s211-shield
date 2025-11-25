// Import new streaming tools
import { createClient, type User } from 'npm:@supabase/supabase-js@2.57.4';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand, // 👈 IMPORT THIS
} from 'npm:@aws-sdk/client-bedrock-runtime@3.614.0';
import { buildPrompt, OutputLanguage, SectionKey } from './prompt.ts';

// --- (CORS Headers) ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// --- (Initialize Bedrock Client) ---
const bedrockClient = new BedrockRuntimeClient({
  region: Deno.env.get('AWS_REGION') ?? 'us-east-2',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') ?? '',
  },
});

// --- (Helper: Non-Streaming Function) ---
async function getFullResponse(payload: Record<string, unknown>) {
  const command = new InvokeModelCommand({
    body: JSON.stringify(payload),
    modelId: 'arn:aws:bedrock:us-east-2:843897427509:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
  });

  const apiResponse = await bedrockClient.send(command);
  const decodedBody = new TextDecoder().decode(apiResponse.body);
  const responseBody = JSON.parse(decodedBody);
  return responseBody.content[0].text;
}

// --- (Helper: Streaming Function) ---
async function getStreamingResponse(payload: Record<string, unknown>) {
  const command = new InvokeModelWithResponseStreamCommand({ // 👈 USE STREAM COMMAND
    body: JSON.stringify(payload),
    modelId: 'arn:aws:bedrock:us-east-2:843897427509:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
  });

  const apiResponse = await bedrockClient.send(command);

  // 1. Create a TransformStream to process chunks
  const transformer = new TransformStream({
    transform(chunk, controller) {
      const decoded = new TextDecoder().decode(chunk);
      try {
        // Parse the JSON chunk from Bedrock
        const jsonChunk = JSON.parse(decoded);
        
        // Check for Anthropic's delta format
        if (jsonChunk.delta && jsonChunk.delta.type === 'text_delta') {
          const textChunk = jsonChunk.delta.text;
          
          // Format as Server-Sent Event (SSE) for the client
          const ssePayload = `data: ${JSON.stringify({ delta: textChunk })}\n\n`;
          controller.enqueue(new TextEncoder().encode(ssePayload));
        }
      } catch (e) {
        // console.error('Error parsing chunk:', decoded);
      }
    },
  });

  // 2. Create the SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Pipe the Bedrock stream through our transformer and then to the client
  (async () => {
    try {
      for await (const chunk of apiResponse.body!) {
        // The chunk from Bedrock is a JSON object, not raw text
        if (chunk.chunk && chunk.chunk.bytes) {
          writer.write(chunk.chunk.bytes);
        }
      }
    } catch (err) {
      console.error('Error in stream processing:', err);
    } finally {
      writer.close();
    }
  })();
  
  const finalStream = readable.pipeThrough(transformer);

  return new Response(finalStream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    status: 200,
  });
}


// --- (Main Server Logic) ---
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 👈 Check for the stream flag
    const { audit_id, language, stream } = await req.json();

    if (!audit_id) {
      throw new Error('audit_id is required.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Loaded keys:', {
      hasUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    });

    let user: any = null;
    const authHeader = req.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (!authError && data?.user) {
        user = data.user;
      }
    }

    if (!user) {
      console.log('⚠️ No user token detected. Proceeding with service role access.');
    }

    let query = supabase
      .from('audits')
      .select('scan_results, checklist_data, is_premium')
      .eq('id', audit_id);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data: auditData, error: dbError } = await query.single();
      
    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    if (!auditData) throw new Error('Audit not found or access denied.');

    const isBypassRequest = req.headers
      .get('Authorization')
      ?.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    if (!auditData.is_premium && !isBypassRequest) {
      throw new Error('Access denied. This is a premium feature.');
    }

    // --- Build the AI Prompt ---
    const outputLang: OutputLanguage = language === 'fr' ? 'fr' : 'en'; // 👈 Use language from request
    const SECTIONS: SectionKey[] = [
      'EXECUTIVE_SUMMARY',
      'ACTION_CHECKLIST',
      'DETAILED_PLAN_BILL_96',
      'DETAILED_PLAN_LAW_25',
      'TEMPLATES_AND_SNIPPETS',
      'REFERENCES',
      'TASKS_INDEX_JSON',
    ];

    const { system, user: userPrompt } = buildPrompt(
      outputLang,
      SECTIONS,
      auditData.scan_results,
      auditData.checklist_data
    );

    // --- Call the Amazon Bedrock API ---
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 30000,
      system: system,
      messages: [{ role: 'user', content: userPrompt }],
    };

    // 👈 ROUTE TO STREAMING OR NON-STREAMING
    if (stream) {
      console.log('🚀 Starting stream...');
      return await getStreamingResponse(payload);
    }

    // --- Return the AI-generated markdown (Non-streaming) ---
    console.log('🤖 Getting full response...');
    const aiResponse = await getFullResponse(payload);

    return new Response(JSON.stringify({ ai_fix: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorWithType = error as Error;
    console.error('Error in get-ai-fix function:', errorWithType.message);
    return new Response(
      JSON.stringify({ error: errorWithType.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});