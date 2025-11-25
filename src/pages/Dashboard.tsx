import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, BadgeCheck } from 'lucide-react';
import { useAuditStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { t } from '../lib/translations';
import { Header } from '../components/Header';
import { AutoScanResults } from '../components/AutoScanResults';
import { ManualChecklist } from '../components/ManualChecklist';
import { PaywallModal } from '../components/PaywallModal';
import { PremiumUpgradeBanner } from '../components/PremiumUpgradeBanner';
import { AuthWallModal } from '../components/AuthWallModal';
import {
 Tabs,
 TabsList,
 TabsTrigger,
 TabsContent,
} from "@/components/ui/tabs";

import 'github-markdown-css/github-markdown.css';

const AUDIT_ID_ERROR_MESSAGE = 'A valid audit ID is required to generate a plan.';

type AiSectionId =
  | 'EXECUTIVE_SUMMARY'
  | 'ACTION_CHECKLIST'
  | 'DETAILED_PLAN_BILL_96'
  | 'DETAILED_PLAN_LAW_25'
  | 'TEMPLATES_AND_SNIPPETS'
  | 'REFERENCES'
  | 'TASKS_INDEX_JSON';

type AiSection = {
  id: AiSectionId;
  label: string;
  content: string;
};

const AI_SECTIONS: ReadonlyArray<{ id: AiSectionId; label: string }> = [
  { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary' },
  { id: 'ACTION_CHECKLIST', label: 'Action Checklist' },
  { id: 'DETAILED_PLAN_BILL_96', label: 'Bill 96 – Detailed Plan' },
  { id: 'DETAILED_PLAN_LAW_25', label: 'Law 25 – Detailed Plan' },
  { id: 'TEMPLATES_AND_SNIPPETS', label: 'Templates & Snippets' },
  { id: 'REFERENCES', label: 'References' },
  { id: 'TASKS_INDEX_JSON', label: 'Tasks Index' },
];

// throttles value updates to avoid re-parsing on every tiny chunk
export function useThrottledValue<T>(value: T, delay = 500): T {
  const [throttled, setThrottled] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setThrottled(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttled;
}


export function parseAiFix(aiFix: string): AiSection[] {
  if (!aiFix) return [];

  const sections: AiSection[] = [];
  const regex = /<<<BEGIN:(.*?)>>>([\s\S]*?)(?=<<<BEGIN:|<<<END:|$)/g;
  const titleMap: Record<string, string> = {
    EXECUTIVE_SUMMARY: "Executive Summary",
    ACTION_CHECKLIST: "Action Checklist",
    DETAILED_PLAN_BILL_96: "Bill 96 – Detailed Plan",
    DETAILED_PLAN_LAW_25: "Law 25 – Detailed Plan",
    TEMPLATES_AND_SNIPPETS: "Templates & Snippets",
    REFERENCES: "References",
    TASKS_INDEX_JSON: "Tasks Index (JSON)",
  };

  let match;
  while ((match = regex.exec(aiFix)) !== null) {
    const id = match[1].trim() as AiSectionId;
    const content = match[2].trim();
    sections.push({
      id,
      label: titleMap[id] || id,
      content,
    });
  }

  return sections;
}

function getAuditId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getFlow() {
  const params = new URLSearchParams(window.location.search);
  return params.get('flow');
}

function isUuid(value: string | null | undefined) {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value.trim(),
  );
}

type GetAiFixArgs = {
  auditId: string;
  language: string;
  accessToken?: string;
  bypass?: boolean;
};

type GetAiFixStreamArgs = GetAiFixArgs & {
  onChunk: (chunk: string) => void;
  onDone: () => void;
};

async function callGetAiFix({ auditId, language, accessToken, bypass = false }: GetAiFixArgs) {
  if (!isUuid(auditId)) {
    throw new Error(AUDIT_ID_ERROR_MESSAGE);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl) {
    console.warn('VITE_SUPABASE_URL is not set; returning placeholder content.');
    return '## Executive Summary\n_(no backend configured)_';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (bypass && supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/get-ai-fix`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ audit_id: auditId, language }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to get AI analysis.');
  }

  const data = await response.json();
  return data.ai_fix as string;
}

async function callGetAiFixStream({
  auditId,
  language,
  accessToken,
  bypass = false,
  onChunk,
  onDone,
}: GetAiFixStreamArgs) {
  if (!isUuid(auditId)) {
    throw new Error(AUDIT_ID_ERROR_MESSAGE);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl) {
    console.warn('VITE_SUPABASE_URL is not set; streaming placeholder content.');
    onChunk('## Executive Summary\n_(no backend configured)_');
    onDone();
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream, text/plain',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (bypass && supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/get-ai-fix`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ audit_id: auditId, language, stream: true }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || 'Failed to stream AI analysis.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const payloadLines = frame
          .split('\n')
          .map((line) => line.match(/^data:\s?(.*)$/)?.[1])
          .filter(Boolean) as string[];

        if (payloadLines.length === 0) continue;

        const payload = payloadLines.join('\n');

        if (payload === '[DONE]' || payload === '__done__') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          if (typeof parsed?.delta === 'string') {
            onChunk(parsed.delta);
            continue;
          }
        } catch {
          // fall through to raw payload
        }

        onChunk(payload);
      }
    }
  } finally {
    onDone();
  }
}

export function Dashboard() {
  const language = useAuditStore((state) => state.language);
  const setAuditData = useAuditStore((state) => state.setAuditData);
  const updateChecklistData = useAuditStore((state) => state.updateChecklistData);
  const isPremium = useAuditStore((state) => state.isPremium);
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const scanResults = useAuditStore((state) => state.scanResults);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [showAuthWall, setShowAuthWall] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallBypassed, setPaywallBypassed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('paywallBypassed') === 'true';
  });

  const [aiFix, setAiFix] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<AiSectionId | null>(null);
  const autoGenerateRef = useRef(false);

  const flow = typeof window !== 'undefined' ? getFlow() : null;

  useEffect(() => {
    const loadAuditData = async () => {
      try {
        const auditId = getAuditId();

        if (!auditId || !isUuid(auditId)) {
          setPageError(t('error.generic', language));
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('audits')
          .select('id, email, scan_results, checklist_data, is_premium, ai_fix')
          .eq('id', auditId)
          .maybeSingle();

        if (fetchError || !data) {
          setPageError(t('error.generic', language));
          setLoading(false);
          return;
        }

        setAuditData({
          auditId: data.id,
          scanResults: data.scan_results,
          checklistData: data.checklist_data || {},
          isPremium: data.is_premium,
        });

        setUserEmail(data.email || '');
        setAiFix(data.ai_fix || null);
        autoGenerateRef.current = Boolean(data.ai_fix);
        setLoading(false);
        setInitialLoadComplete(true);

        if (flow === 'premium' && !paywallBypassed && !data.is_premium) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            setShowPaywall(true);
          } else {
            setShowAuthWall(true);
          }
        }
      } catch (err) {
        console.error(err);
        setPageError(t('error.generic', language));
        setLoading(false);
      }
    };

    void loadAuditData();
  }, [language, flow, paywallBypassed, setAuditData]);

  const gateNonPremiumAction = useCallback(() => {
    if (isPremium || paywallBypassed) return true;

    if (isLoggedIn) {
      setShowPaywall(true);
    } else {
      setShowAuthWall(true);
    }

    return false;
  }, [isLoggedIn, isPremium, paywallBypassed]);

  const handleSaveChecklist = useCallback(
    async (updatedChecklist: Record<string, unknown>) => {
      if (!gateNonPremiumAction()) return;

      const auditId = getAuditId();
      if (!auditId || !isUuid(auditId)) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await fetch(`${supabaseUrl}/functions/v1/update-checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ audit_id: auditId, checklist_data: updatedChecklist }),
      });

      updateChecklistData(updatedChecklist);
    },
    [gateNonPremiumAction, updateChecklistData],
  );

  const handleFixClick = useCallback(async () => {
  if (!gateNonPremiumAction()) return;

  const auditId = getAuditId();
  if (!auditId || !isUuid(auditId)) {
    setAiError(AUDIT_ID_ERROR_MESSAGE);
    return;
  }

  setLoadingAi(true);
  setAiError(null);
  setAiFix(null);

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const hasSession = !sessionError && !!session?.access_token;

    if (!hasSession && !paywallBypassed) {
      throw new Error("You must be logged in.");
    }

    autoGenerateRef.current = true;
    const streamedChunks: string[] = [];

    const handleSaveToDb = async (finalOutput: string) => {
      try {
        await supabase.from("audits").update({ ai_fix: finalOutput }).eq("id", auditId);
      } catch (saveErr) {
        console.error("❌ Failed to save ai_fix to DB:", saveErr);
      }
    };

    const handleStream = async (args: {
      accessToken?: string;
      bypass?: boolean;
    }) => {
      await callGetAiFixStream({
        auditId,
        language,
        ...args,
        onChunk: (chunk) => {
          streamedChunks.push(chunk);
          setAiFix((prev) => (prev || "") + chunk);
        },
        onDone: async () => {
          const finalOutput = streamedChunks.join("");
          if (finalOutput.trim().length === 0) {
            // fallback non-stream version if nothing streamed
            try {
              const aiFixText = await callGetAiFix({
                auditId,
                language,
                ...args,
              });
              setAiFix(aiFixText);
              await handleSaveToDb(aiFixText);
            } catch (error) {
              setAiError((error as Error).message);
            }
          } else {
            // ✅ Save streamed result to DB
            await handleSaveToDb(finalOutput);
          }
        },
      });
    };

    if (paywallBypassed) {
      await handleStream({ bypass: true });
    } else {
      await handleStream({ accessToken: session?.access_token });
    }
  } catch (error) {
    const err = error as Error;
    setAiError(err.message || "Failed to generate AI analysis.");
  } finally {
    setLoadingAi(false);
  }
}, [gateNonPremiumAction, language, paywallBypassed]);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('paywallBypassed', paywallBypassed ? 'true' : 'false');

    if (paywallBypassed) {
      setShowAuthWall(false);
      setShowPaywall(false);
    }
  }, [paywallBypassed]);

  const togglePaywallBypassLabel = useMemo(
    () => (paywallBypassed ? 'Disable Paywall Bypass' : 'Bypass Paywall (Test)'),
    [paywallBypassed],
  );

  const throttledAiFix = useThrottledValue(aiFix, 500);
  const parsedAiSections = useMemo(() => parseAiFix(throttledAiFix || ''), [throttledAiFix]);
  const activeSection = useMemo(() => {
    if (!parsedAiSections.length) return null;
    return parsedAiSections.find((section) => section.id === activeSectionId) ?? parsedAiSections[0];
  }, [parsedAiSections, activeSectionId]);
  const effectiveActiveSectionId = activeSection?.id ?? null;

  const hasExistingOutput = useMemo(() => Boolean(aiFix && aiFix.trim().length > 0), [aiFix]);
  const canGenerate = isPremium || paywallBypassed;
  const showPremiumBadge = isPremium || paywallBypassed;

  useEffect(() => {
    if (!parsedAiSections.length) {
      setActiveSectionId(null);
      return;
    }

    setActiveSectionId((prev) => {
      if (prev && parsedAiSections.some((section) => section.id === prev)) {
        return prev;
      }

      const firstId = parsedAiSections[0]?.id as AiSectionId | undefined;
      return firstId ?? null;
    });
  }, [parsedAiSections]);

  useEffect(() => {
    if (!initialLoadComplete) return;
    if (!canGenerate) return;
    if (hasExistingOutput) return;
    if (loadingAi) return;
    if (autoGenerateRef.current) return;

    autoGenerateRef.current = true;
    void handleFixClick();
  }, [initialLoadComplete, canGenerate, hasExistingOutput, loadingAi, handleFixClick]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">{t('loading', language)}</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-red-600">{pageError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title', language)}</h1>
            {showPremiumBadge && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <BadgeCheck className="h-4 w-4" />
                Premium
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {!isPremium && (
              <button
                onClick={() => setPaywallBypassed((prev) => !prev)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {togglePaywallBypassLabel}
              </button>
            )}
          </div>
        </div>

        {paywallBypassed && (
          <p className="mb-6 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            {t('dashboard.paywallBypass.note', language)}
          </p>
        )}

        {!isPremium && !paywallBypassed && (
          <div className="mb-6">
            <PremiumUpgradeBanner
              onUpgradeClick={() => {
                if (!isLoggedIn) {
                  setShowAuthWall(true);
                } else {
                  setShowPaywall(true);
                }
              }}
            />
          </div>
        )}

        <div className="space-y-6">
          {scanResults && (
            <AutoScanResults onFixClick={handleFixClick} forceFixButton={paywallBypassed} />
          )}

          <ManualChecklist onSave={handleSaveChecklist} />

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Compliance Analysis</h2>
                  {hasExistingOutput ? (
                    <p className="text-sm text-gray-500">Your latest premium analysis is ready below.</p>
                  ) : (
                    <p className="text-sm text-gray-500">Generate a personalized action plan for this audit.</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleFixClick}
                disabled={!canGenerate || loadingAi}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !canGenerate || loadingAi
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {hasExistingOutput ? 'Regenerate analysis' : 'Generate analysis'}
              </button>
            </div>

            {!canGenerate && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                AI analysis requires premium access.
              </div>
            )}

            {aiError && !loadingAi && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{aiError}</div>
            )}

            {loadingAi && (
              <div className="mt-6 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-gray-600">
                <Sparkles className="mr-3 h-5 w-5 animate-spin text-blue-600" />
                Generating your AI fix plan... (This can take 30 seconds)
              </div>
            )}

            {aiFix && (
              <div className="mt-6">
                {parsedAiSections.length > 0 ? (
                  <Tabs
                    value={activeSectionId || parsedAiSections[0].id}
                    onValueChange={(val: string) => setActiveSectionId(val as AiSectionId)}
                    className="w-full"
                  >
                    <TabsList className="flex space-x-2 border-b mb-4 overflow-x-auto">
                      {parsedAiSections.map((section) => (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                            !(throttledAiFix || '').includes(`<<<END:${section.id}>>>`)
                              ? "opacity-60 italic"
                              : ""
                          }`}
                        >
                          {section.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {parsedAiSections.map((section) => (
                      <TabsContent key={section.id} value={section.id}>
                        <div className="markdown-body mt-4">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown>{aiFix}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

          </section>
        </div>
      </main>

      <AuthWallModal
        isOpen={showAuthWall}
        onClose={() => setShowAuthWall(false)}
        onSuccess={() => {
          setShowAuthWall(false);
          setShowPaywall(true);
        }}
        email={userEmail}
      />

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}

export default Dashboard;