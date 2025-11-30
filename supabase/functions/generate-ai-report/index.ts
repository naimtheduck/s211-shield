import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS Preflight - CRITICAL: Must be first
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 2. Read Secrets INSIDE the handler (Safe Mode)
    // This prevents the function from crashing on startup if a secret is missing
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENROUTER_API_KEY) throw new Error("Configuration Error: Missing OPENROUTER_API_KEY secret.");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Configuration Error: Missing Supabase secrets.");

    // 3. Parse Request
    const { companyName, vendorCount, highRiskCount, verifiedCount, vendorIds } = await req.json();

    // 4. Fetch Evidence (If IDs provided)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let evidenceSummary = "No specific evidence documents were linked.";

    if (vendorIds && vendorIds.length > 0) {
        const { data: requests, error: reqError } = await supabase
            .from("supplier_requests")
            .select("company_vendor_id, status, evidence_files, company_vendors(vendor:vendors(company_name))")
            .in("company_vendor_id", vendorIds)
            .eq("status", "SUBMITTED");

        if (!reqError && requests) {
            const fileList = requests.map(r => {
                // @ts-ignore
                const vName = r.company_vendors?.vendor?.company_name || "Unknown Vendor";
                // @ts-ignore
                const files = r.evidence_files ? r.evidence_files.map(f => f.path.split('/').pop()).join(", ") : "No files";
                return `- ${vName}: ${files}`;
            }).join("\n");
            
            if (fileList.length > 0) {
                evidenceSummary = `The following evidence documents have been collected and verified:\n${fileList}`;
            }
        }
    }

    // 5. Construct Prompt
    const systemPrompt = `
      You are an expert Legal Compliance Officer specializing in Canada's "Fighting Against Forced Labour and Child Labour in Supply Chains Act" (Bill S-211).
      Your task is to write the "Risk Assessment & Due Diligence" section of the annual report for a company.
      
      Tone: Professional, defensible, factual, legalistic but clear.
      Format: Use Markdown headers (##) for sections.
      
      Structure the report into these 4 sections:
      1. Supply Chain Structure
      2. Risk Identification Process
      3. Mitigation Measures
      4. Remediation Actions
    `;

    const userPrompt = `
      Write the S-211 Risk Assessment for my company.
      
      Company Name: ${companyName}
      Total Tier-1 Vendors: ${vendorCount}
      High-Risk Vendors Flagged: ${highRiskCount}
      Vendors Verified (Signed Attestation): ${verifiedCount}
      
      Context:
      - We use a "Risk-Based Approach".
      - We flag vendors based on jurisdiction and industry.
      - We require high-risk vendors to sign a cascading warranty against forced labour.
      - We collect evidence (policies/certifications) via a secure portal.

      EVIDENCE COLLECTED:
      ${evidenceSummary}
    `;

    // 6. Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://s211-shield.com", 
        "X-Title": "S-211 Shield",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast:free", // User requested model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        reasoning: { enabled: true }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter Error:", errText);
      throw new Error(`OpenRouter Provider Error: ${response.statusText}`);
    }

    const aiData = await response.json();
    const reportText = aiData.choices[0]?.message?.content || "Error: No response generated.";

    return new Response(JSON.stringify({ 
      success: true, 
      reportText 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    // Return 200 with error message so frontend doesn't show CORS error
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});