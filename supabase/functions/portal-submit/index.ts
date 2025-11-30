import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, filePath } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get Request ID
    const { data: request } = await supabase
      .from("supplier_requests")
      .select("id, company_vendor_id, evidence_files")
      .eq("magic_token", token)
      .single();

    if (!request) throw new Error("Invalid Token");

    // 2. Prepare JSONB Update (THE FIX)
    // We append the new file to the existing array (or create a new one)
    const currentFiles = Array.isArray(request.evidence_files) ? request.evidence_files : [];
    const newFiles = [...currentFiles, { path: filePath, uploaded_at: new Date().toISOString() }];

    // 3. Update Request
    const { error: updateError } = await supabase
      .from("supplier_requests")
      .update({
        status: 'SUBMITTED',
        evidence_files: newFiles, // Saving as JSONB
        submitted_at: new Date().toISOString() // Correct column name from schema
      })
      .eq("id", request.id);

    if (updateError) throw updateError;

    // 4. Update Vendor Status
    await supabase
      .from("company_vendors")
      .update({ verification_status: 'VERIFIED' })
      .eq("id", request.company_vendor_id);

    // 5. Log
    await supabase.from("compliance_logs").insert({
      company_vendor_id: request.company_vendor_id,
      action_type: "VENDOR_SUBMITTED",
      details: "Vendor submitted certification"
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});