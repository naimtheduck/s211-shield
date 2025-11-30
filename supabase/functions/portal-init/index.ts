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
    const { token } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find the Request
    const { data: request, error: reqError } = await supabase
      .from("supplier_requests")
      .select("id, status, company_vendor_id")
      .eq("magic_token", token)
      .single();

    if (reqError || !request) throw new Error("Invalid or expired token.");

    // 2. Fetch Details via Reporting Cycle (THE FIX)
    const { data: cvData, error: cvError } = await supabase
      .from("company_vendors")
      .select(`
        vendor:vendors(company_name),
        reporting_cycle:reporting_cycles(
          company:companies(name)
        )
      `)
      .eq("id", request.company_vendor_id)
      .single();

    if (cvError) throw new Error("Database Error: " + cvError.message);

    // Extract names safely
    // @ts-ignore
    const companyName = cvData?.reporting_cycle?.company?.name;
    // @ts-ignore
    const vendorName = cvData?.vendor?.company_name;

    if (!companyName || !vendorName) throw new Error("System Error: Could not resolve Company or Vendor name.");

    // 3. Mark as Viewed
    if (request.status === 'PENDING') {
      await supabase.from("supplier_requests").update({ status: 'VIEWED' }).eq("id", request.id);
    }

    // 4. Generate Upload URL
    const fileName = `evidence/${request.id}/${Date.now()}.pdf`;
    const { data: signData, error: signError } = await supabase
      .storage
      .from('compliance-docs')
      .createSignedUploadUrl(fileName);

    if (signError) throw new Error("Storage Error: " + signError.message);

    return new Response(JSON.stringify({
      success: true,
      data: {
        company_name: companyName,
        vendor_name: vendorName,
        uploadUrl: signData.signedUrl,
        uploadPath: signData.path,
        status: request.status
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200, // Return 200 so frontend can read the error message
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});