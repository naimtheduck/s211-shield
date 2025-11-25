import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

// --- (CORS Headers) ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // This function only needs POST
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// --- (Shared Types) ---
interface UpdateRequest {
  audit_id: string; // The UUID of the audit we're updating
  checklist_data: any; // The JSON object of the user's answers
}

console.log('--- "update-checklist" function initializing ---');

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Get the audit_id and the checklist_data from the request
    const { audit_id, checklist_data }: UpdateRequest = await req.json();

    if (!audit_id) {
      throw new Error("Audit ID is required.");
    }
    if (!checklist_data) {
      throw new Error("Checklist data is required.");
    }

    // 3. Create a Supabase client
    // We use the ANON_KEY because your RLS policies allow anon to update.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Update the existing record in the 'audits' table
    const { data, error } = await supabase
      .from('audits')
      .update({
        checklist_data: checklist_data, // Save the user's answers
        updated_at: new Date().toISOString(), // Update the timestamp
      })
      .eq('id', audit_id) // Where the ID matches
      .select('id') // Return the ID to confirm
      .single();

    if (error) {
      console.error('Supabase update error:', error.message);
      throw new Error(`Supabase update error: ${error.message}`);
    }

    console.log(`[Function] Updated checklist for audit: ${data.id}`);

    // 5. Return a simple success message
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Checklist saved successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Function] Error: ${message}`);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
