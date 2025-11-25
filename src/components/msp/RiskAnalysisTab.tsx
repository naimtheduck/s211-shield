import { useState } from 'react';
import { AlertOctagon, ShieldCheck, RefreshCw, Zap, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SelectedTool {
  id: string;
  name: string;
  category: string;
  draft_text: string; 
}

export interface RiskAssessment {
  tool_id: string;
  risk_description: string;
  mitigation_strategy: string;
  residual_risk: 'Low' | 'Medium' | 'High';
}

interface RiskAnalysisTabProps {
  tools: SelectedTool[];
  risks: RiskAssessment[];
  onUpdateRisks: (newRisks: RiskAssessment[]) => void;
}

export function RiskAnalysisTab({ tools, risks, onUpdateRisks }: RiskAnalysisTabProps) {
  const [activeToolId, setActiveToolId] = useState<string | null>(tools[0]?.id || null);
  
  // Loading state tracks specifically WHAT is loading
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // --- Brainstorming Menus State ---
  const [riskSuggestions, setRiskSuggestions] = useState<string[]>([]);
  const [mitigationSuggestions, setMitigationSuggestions] = useState<string[]>([]);
  const [showRiskMenu, setShowRiskMenu] = useState(false);
  const [showMitigationMenu, setShowMitigationMenu] = useState(false);

  // Helper to get or create risk for a tool
  const getRisk = (tool: SelectedTool): RiskAssessment => {
    return risks.find(r => r.tool_id === tool.id) || {
      tool_id: tool.id,
      risk_description: tool.draft_text || '', 
      mitigation_strategy: '',
      residual_risk: 'Medium' // Default value, hidden from UI now
    };
  };

  const updateRisk = (toolId: string, field: keyof RiskAssessment, value: any) => {
    const currentRisk = getRisk(tools.find(t => t.id === toolId)!);
    const updatedRisk = { ...currentRisk, [field]: value };
    
    const otherRisks = risks.filter(r => r.tool_id !== toolId);
    onUpdateRisks([...otherRisks, updatedRisk]);
  };

  // --- AI ACTION: Brainstorming ---
  const handleBrainstorm = async (type: 'risk' | 'mitigation') => {
    const tool = tools.find(t => t.id === activeToolId);
    if (!tool) return;

    const actionId = `${type}-brainstorm`;
    setLoadingAction(actionId);
    
    try {
      const riskData = getRisk(tool);
      
      // Dynamic Prompt Construction
      const systemContext = type === 'risk' 
        ? `List 5 potential privacy/security risks for a ${tool.category} tool named "${tool.name}".` 
        : `List 5 specific mitigation strategies (technical or legal) for these risks: "${riskData.risk_description}".`;

      // Call Edge Function
      const { data } = await supabase.functions.invoke('ai-brainstorm', {
        body: { 
          prompt: systemContext,
          format: 'list'
        }
      });

      // Handle response
      let items: string[] = [];
      if (data?.items) {
        items = data.items;
      } else if (data?.result) {
         items = data.result.split('\n').map((l: string) => l.replace(/^[•-]\s*/, '').trim()).filter((l: string) => l.length > 0);
      } else {
        // Mock Fallback
        items = type === 'risk' 
          ? [`Data residency issues (${tool.name} servers)`, `Uncontrolled user access`, `Lack of activity logging`, `Insecure data transfer`, `Subprocessor dependency`]
          : [`Implement Multi-Factor Authentication (MFA)`, `Sign Data Processing Agreement (DPA)`, `Restrict access to specific IPs`, `Enable Audit Logs`, `Encrypt data at rest`];
      }

      if (type === 'risk') {
        setRiskSuggestions(items);
        setShowRiskMenu(true);
      } else {
        setMitigationSuggestions(items);
        setShowMitigationMenu(true);
      }

    } catch (e) {
      console.error("AI Error", e);
    } finally {
      setLoadingAction(null);
    }
  };

  const acceptSuggestion = (type: 'risk' | 'mitigation', text: string) => {
    if (!activeToolId) return;
    const field = type === 'risk' ? 'risk_description' : 'mitigation_strategy';
    const currentVal = getRisk(tools.find(t => t.id === activeToolId)!)[field];
    
    // Append nicely
    const newVal = currentVal ? `${currentVal}\n- ${text}` : `- ${text}`;
    updateRisk(activeToolId, field, newVal);
    
    // Remove from suggestions list to prevent duplicates
    if (type === 'risk') {
        setRiskSuggestions(prev => prev.filter(i => i !== text));
        if (riskSuggestions.length <= 1) setShowRiskMenu(false);
    } else {
        setMitigationSuggestions(prev => prev.filter(i => i !== text));
        if (mitigationSuggestions.length <= 1) setShowMitigationMenu(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Tool Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <AlertOctagon size={14} /> Risk Targets
        </h3>
        <div className="space-y-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all ${
                activeToolId === tool.id 
                  ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-white relative">
        {activeToolId && tools.find(t => t.id === activeToolId) ? (
          <div className="max-w-5xl mx-auto">
            {(() => {
              const tool = tools.find(t => t.id === activeToolId)!;
              const risk = getRisk(tool);

              return (
                <div className="space-y-8">
                  {/* Header Area - Simplified */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{tool.name} Risk Assessment</h2>
                        <p className="text-sm text-slate-500">Identify risks and define mitigation controls.</p>
                    </div>
                    
                    {/* Removed Residual Risk Dropdown as requested */}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* --- LEFT COLUMN: RISK IDENTIFICATION --- */}
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-red-600 font-bold uppercase text-xs tracking-wider">
                                <AlertOctagon size={14} /> Risk Identification
                            </div>
                            <button 
                                onClick={() => handleBrainstorm('risk')}
                                disabled={!!loadingAction}
                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded-md font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                {loadingAction === 'risk-brainstorm' ? <RefreshCw size={12} className="animate-spin"/> : <Zap size={12}/>}
                                AI Brainstorm Risks
                            </button>
                        </div>

                        <div className="relative flex-1">
                           {/* AI Menu Overlay */}
                           {showRiskMenu && riskSuggestions.length > 0 && (
                             <div className="mb-3 bg-white border border-red-100 rounded-xl shadow-lg overflow-hidden animation-fade-in z-10 relative">
                                <div className="bg-red-50 px-3 py-2 flex justify-between items-center">
                                   <span className="text-xs font-bold text-red-800">Select risks to add:</span>
                                   <button onClick={() => setShowRiskMenu(false)}><X size={12} className="text-red-400 hover:text-red-600"/></button>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-1">
                                   {riskSuggestions.map((suggestion, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => acceptSuggestion('risk', suggestion)}
                                        className="w-full text-left text-sm p-2 hover:bg-slate-50 rounded flex items-start gap-2 group"
                                      >
                                         <Plus size={14} className="mt-0.5 text-slate-400 group-hover:text-red-500"/>
                                         <span className="text-slate-700 group-hover:text-slate-900">{suggestion}</span>
                                      </button>
                                   ))}
                                </div>
                             </div>
                           )}

                           <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 h-96 relative group">
                              <textarea 
                                  className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-sm text-slate-700 leading-relaxed placeholder-red-300"
                                  placeholder="Describe the privacy risks (e.g. Hosting location, Access control)..."
                                  value={risk.risk_description}
                                  onChange={(e) => updateRisk(activeToolId, 'risk_description', e.target.value)}
                              />
                           </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: MITIGATION CONTROLS --- */}
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-green-600 font-bold uppercase text-xs tracking-wider">
                                <ShieldCheck size={14} /> Mitigation Controls
                            </div>
                             <button 
                                onClick={() => handleBrainstorm('mitigation')}
                                disabled={!!loadingAction}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                {loadingAction === 'mitigation-brainstorm' ? <RefreshCw size={12} className="animate-spin"/> : <Zap size={12}/>}
                                AI Suggest Controls
                            </button>
                        </div>

                        <div className="relative flex-1">
                           {/* AI Menu Overlay */}
                           {showMitigationMenu && mitigationSuggestions.length > 0 && (
                             <div className="mb-3 bg-white border border-green-100 rounded-xl shadow-lg overflow-hidden animation-fade-in z-10 relative">
                                <div className="bg-green-50 px-3 py-2 flex justify-between items-center">
                                   <span className="text-xs font-bold text-green-800">Select controls to add:</span>
                                   <button onClick={() => setShowMitigationMenu(false)}><X size={12} className="text-green-400 hover:text-green-600"/></button>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-1">
                                   {mitigationSuggestions.map((suggestion, idx) => (
                                      <button 
                                        key={idx}
                                        onClick={() => acceptSuggestion('mitigation', suggestion)}
                                        className="w-full text-left text-sm p-2 hover:bg-slate-50 rounded flex items-start gap-2 group"
                                      >
                                         <Plus size={14} className="mt-0.5 text-slate-400 group-hover:text-green-500"/>
                                         <span className="text-slate-700 group-hover:text-slate-900">{suggestion}</span>
                                      </button>
                                   ))}
                                </div>
                             </div>
                           )}

                           {/* FIXED: Darker text and placeholder for readability */}
                           <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 h-96 relative group">
                              <textarea 
                                  className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-sm text-green-900 leading-relaxed placeholder-green-600/60"
                                  placeholder="Describe technical and organizational measures (e.g. Encryption, DPA, MFA)..."
                                  value={risk.mitigation_strategy}
                                  onChange={(e) => updateRisk(activeToolId, 'mitigation_strategy', e.target.value)}
                              />
                           </div>
                        </div>
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldCheck size={48} className="mb-4 text-slate-200" />
            <p>Select a tool to assess risks.</p>
          </div>
        )}
      </div>
    </div>
  );
}