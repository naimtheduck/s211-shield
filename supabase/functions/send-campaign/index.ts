// supabase/functions/send-campaign/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Validate User
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) throw new Error("Unauthorized");

    // 3. Parse Request
    const { ids, subject, body, test_mode } = await req.json();

    // --- TEST MODE BLOCK (Sends to You) ---
    if (test_mode) {
      console.log("Sending test email to:", user.email);
      
      const { error: emailError } = await resend.emails.send({
        from: "Compliance Shield <onboarding@resend.dev>",
        to: [user.email!], // Send to the logged-in user
        subject: `[TEST] ${subject}`,
        text: body
          .replace("{{Company Name}}", "[Test Vendor Name]") // <--- Shows where Vendor Name goes
          .replace("{{Client Name}}", "[Your Company Name]") // <--- Shows where Your Name goes
          .replace("{{Link}}", "https://example.com/demo-link")
          .replace("{{Deadline}}", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()),
      });

      if (emailError) throw new Error("Resend Error: " + emailError.message);

      return new Response(JSON.stringify({ success: true, message: "Test sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // -------------------------------------

    // 4. Validate Campaign Recipients
    if (!ids || ids.length === 0) throw new Error("No recipients selected");

    const results = [];

    // 5. Loop through Targets
    for (const companyVendorId of ids) {
      
      // A. Fetch Vendor AND Company details
      const { data: cv } = await supabase
        .from("company_vendors")
        .select(`
          *,
          vendor:vendors(*),
          reporting_cycle:reporting_cycles(
            company:companies(*)
          )
        `)
        .eq("id", companyVendorId)
        .single();

      if (!cv) {
        console.error(`Vendor ${companyVendorId} not found`);
        results.push({ id: companyVendorId, status: "error", message: "Vendor Not Found" });
        continue;
      }

      // Extract Names Carefully
      // @ts-ignore
      const clientName = cv.reporting_cycle?.company?.name || "Our Company"; // YOU
      // @ts-ignore
      const vendorName = cv.vendor?.company_name || "Valued Supplier";       // THEM

      // B. Create Magic Link Record
      const { data: request, error: reqError } = await supabase
        .from("supplier_requests")
        .insert({
          company_vendor_id: companyVendorId,
          status: "PENDING"
        })
        .select()
        .single();

      if (reqError) {
        console.error("DB Error creating request:", reqError);
        results.push({ id: companyVendorId, status: "error", message: "DB Error" });
        continue;
      }

      // C. Prepare Email Content
      const origin = req.headers.get("origin") || "http://localhost:5173";
      const magicLink = `${origin}/verify?token=${request.magic_token}`;
      
      const personalizedBody = body
        .replace("{{Company Name}}", vendorName) // <--- FIX: Now maps to Vendor Name
        .replace("{{Client Name}}", clientName)   // <--- NEW: Maps to Your Name
        .replace("{{Link}}", magicLink)
        .replace("{{Deadline}}", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString());

      // D. Send via Resend
      // NOTE: In Resend 'Dev Mode', you can ONLY send to your own registered email.
      // To prevent crashes during testing, we force the recipient to be YOU (the logged-in user).
      // Once you add a domain in Resend, change this to: `to: [cv.vendor.contact_email]`
      const recipientEmail = user.email!; 

      const { error: emailError } = await resend.emails.send({
        from: "Compliance Shield <onboarding@resend.dev>",
        to: [recipientEmail], 
        subject: subject,
        text: personalizedBody,
      });

      if (emailError) {
        console.error("Email failed:", emailError);
        results.push({ id: companyVendorId, status: "failed", error: emailError });
      } else {
        // E. Update Status
        await supabase
          .from("company_vendors")
          .update({ verification_status: "SENT" })
          .eq("id", companyVendorId);
          
        results.push({ id: companyVendorId, status: "success" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});