import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.47/deno-dom-wasm.ts';

// --- (CORS Headers) ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// --- (Shared Types) ---
interface ScanRequest { email: string; url: string; }
interface ScanResults {
  privacyPolicy: 'found' | 'not_found' | 'partial';
  cookieConsent: 'found' | 'not_found' | 'partial';
  langTag: 'fr' | 'en' | 'other' | 'not_found';
  error?: string;
}

// --- (Core Scanner Logic) ---
async function performScan(url: string): Promise<ScanResults> {
  // ... (This function remains unchanged)
  let htmlContent = '';
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
    if (!response.ok) throw new Error(`Fetch failed with status: ${response.status} ${response.statusText}`);
    htmlContent = await response.text();
  } catch (err) {
    const error = err as Error;
    return { privacyPolicy: 'not_found', cookieConsent: 'not_found', langTag: 'not_found', error: `Failed to fetch URL: ${error.message}.` };
  }
  try {
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
    if (!doc) throw new Error('Could not parse HTML document.');
    const policySelector = 'a[href*="privacy"], a[href*="politique-de-confidentialite"], a[href*="confidentialite"], a[href*="legal"], a[href*="terms"], a[href*="conditions-d-utilisation"], a[href*="vie-privee"]';
    const privacyPolicy: ScanResults['privacyPolicy'] = doc.querySelector(policySelector) ? 'found' : 'not_found';
    const htmlLower = htmlContent.toLowerCase();
    let cookieConsent: ScanResults['cookieConsent'] = 'not_found';
    const cmpSelectors = ['#onetrust-banner-sdk', '.cky-banner', '#cookie-notice', '#CybotCookiebotDialog', '[id*="cookie-consent"]', '[class*="cookie-banner"]'];
    if (doc.querySelector(cmpSelectors.join(', '))) { cookieConsent = 'found'; } 
    else if (htmlLower.includes('cookie') || htmlLower.includes('témoin')) { cookieConsent = 'partial'; }
    const langAttr = doc.documentElement?.getAttribute('lang')?.toLowerCase();
    const langTag: ScanResults['langTag'] = langAttr?.startsWith('fr') ? 'fr' : (langAttr ? 'other' : 'not_found');
    return { privacyPolicy, cookieConsent, langTag };
  } catch (parseError) {
    const error = parseError as Error;
    return { privacyPolicy: 'not_found', cookieConsent: 'not_found', langTag: 'not_found', error: `Failed to parse HTML: ${error.message}` };
  }
}

// --- (Main Server Logic) ---
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[instant-scan] Function invoked.'); // <-- DEBUG 1

    const { email, url }: ScanRequest = await req.json();
    
    console.log(`[instant-scan] Received body:`, { email, url }); // <-- DEBUG 2

    if (!email || !url) {
      console.error('[instant-scan] Validation failed: Email or URL is missing.'); // <-- DEBUG 3
      throw new Error("Email and URL are required.");
    }

    // 1. Run the real scanner
    const scanResults = await performScan(url);

    // 2. Create an *anonymous* Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Insert the new *anonymous* audit
    const { data, error } = await supabaseAdmin
      .from('audits')
      .insert({
        email,
        url,
        scan_results: scanResults as any,
      })
      .select('id, scan_results')
      .single();

    if (error) {
      console.error('[instant-scan] Supabase insert error:', error.message); // <-- DEBUG 4
      throw error;
    }

    // 4. Return the new audit_id
    return new Response(
      JSON.stringify({ audit_id: data.id, scan_results: data.scan_results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorWithType = error as Error;
    console.error('[instant-scan] Function failed with 400:', errorWithType.message); // <-- DEBUG 5
    return new Response(
      JSON.stringify({ error: errorWithType.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});