import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

// --- (CORS Headers) ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// --- (Shared Types) ---
interface ClaimRequest {
  email: string;
  password: string;
  audit_id: string; // The anonymous audit ID
}

console.log('--- "auth-claim-account" function initializing ---');

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 2. Get the data from the frontend
    const { email, password, audit_id }: ClaimRequest = await req.json();
    if (!email || !password || !audit_id) {
      throw new Error("Email, password, and audit_id are required.");
    }

    // 3. We MUST use the Admin client (SERVICE_ROLE_KEY) here.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use your custom secret
    );

    let new_user_id: string;

    // 4. Try to create the new user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      // --- THIS IS THE "USER ALREADY EXISTS" FIX ---
      if (authError.message.includes("User already registered")) {
        
        // User exists, so let's try to log them in instead.
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (signInError) {
          // Password was wrong
          throw new Error(`User exists, but password was incorrect.`);
        }
        if (!signInData.user) {
          throw new Error("Login failed: Could not get user data.");
        }
        
        new_user_id = signInData.user.id;
        console.log(`[Function] Existing user signed in: ${new_user_id}`);

      } else {
        // A different auth error happened (e.g., weak password)
        throw new Error(`Auth error: ${authError.message}`);
      }
      // --- END OF NEW LOGIC ---
      
    } else {
      // Sign up was successful
      if (!authData.user) {
        throw new Error("Auth error: Could not create user.");
      }
      new_user_id = authData.user.id;
      console.log(`[Function] New user created: ${new_user_id}`);
    }


    // 5. "Claim" the anonymous audit
    //
    // --- THIS IS THE "CANNOT COERCE" FIX ---
    //
    // 5A. REMOVE .single() from this query
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        user_id: new_user_id, // Link it to the new user
        email: email, // Ensure email is up to date
        updated_at: new Date().toISOString(),
      })
      .eq('id', audit_id) // Find the anonymous record
      .is('user_id', null) // IMPORTANT: Only claim it if it's still anonymous
      .select('id'); // <-- .single() is GONE

    if (updateError) {
      console.error(`Database update error: ${updateError.message}`);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    // 5B. MODIFY this 'if' check to look at the array length
    if (!updateData || updateData.length === 0) {
      // This is not an error, it just means the audit was *already* claimed.
      // We can continue successfully.
      console.log(`[Function] Audit ${audit_id} was already claimed.`);
    } else {
      console.log(`[Function] Audit ${audit_id} successfully claimed by user ${new_user_id}.`);
    }

    // 6. Return a success message to the frontend
    return new Response(
      JSON.stringify({ status: 'ok', user_id: new_user_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorWithType = error as Error;
    return new Response(
      JSON.stringify({ error: errorWithType.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});