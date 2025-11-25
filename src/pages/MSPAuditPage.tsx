import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuditStore } from '../lib/store';
import { 
  Save, ShieldAlert, LayoutDashboard, List, 
  Network, AlertOctagon, ShieldCheck, Gavel, FileCheck,
  Loader2
} from 'lucide-react';

// --- Components ---
import { AssetSidebar } from '../components/msp/AssetSidebar';
import { IntelligenceSidebar } from '../components/msp/IntelligenceSidebar';
import { ProjectScopeTab, ProjectScope } from '../components/msp/ProjectScopeTab';
import { SoftwareInventoryTab } from '../components/msp/SoftwareInventoryTab';
import { DataFlowsTab, DataFlow } from '../components/msp/DataFlowsTab';
import { RiskAnalysisTab, RiskAssessment } from '../components/msp/RiskAnalysisTab';
import { DecisionTab } from '../components/msp/DecisionTab';
import { ReportTab } from '../components/msp/ReportTab';

// --- Types ---
export interface SelectedTool {
  id: string;
  name: string;
  category: string;
  draft_text: string;
  context_note: string;
  data_types: string;
  status: 'draft' | 'ready';
}

export interface FinalDecision {
  risk_level: 'Low' | 'Medium' | 'High';
  approval_status: 'Approved' | 'Rejected' | 'Conditional';
  comments: string;
  auditor_name: string;
}

const PROJECT_TABS = [
  { id: 'scope', labelEn: '1. Scope', labelFr: '1. Portée', icon: LayoutDashboard },
  { id: 'inventory', labelEn: '2. Inventory', labelFr: '2. Inventaire', icon: List }, 
  { id: 'flows', labelEn: '3. Data Flows', labelFr: '3. Flux', icon: Network },
  { id: 'risks', labelEn: '4. Risks', labelFr: '4. Risques', icon: AlertOctagon },
  { id: 'decision', labelEn: '7. Decision', labelFr: '7. Décision', icon: Gavel },
  { id: 'report', labelEn: '8. Report', labelFr: '8. Rapport', icon: FileCheck },
];

export default function MSPAuditPage() {
  const language = useAuditStore((state) => state.language);
  const t = (en: string, fr: string) => (language === 'en' ? en : fr);

  // --- GLOBAL STATE ---
  const [clientName, setClientName] = useState('');
  const [projectScope, setProjectScope] = useState<ProjectScope>({
    description: '', sensitive_data: false, data_types: [], target_population: '', additional_context: ''
  });
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [finalDecision, setFinalDecision] = useState<FinalDecision>({
    risk_level: 'Medium', approval_status: 'Conditional', comments: '', auditor_name: ''
  });

  // --- LAYOUT STATE ---
  const [activeProjectTab, setActiveProjectTab] = useState('scope');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(360);
  const [resizingSide, setResizingSide] = useState<'left' | 'right' | null>(null);
  
  // --- META STATE ---
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // --- LOGIC: ADD TOOL (From Sidebar) ---
  const addTool = (tool: any) => {
    if (selectedTools.some(t => t.id === tool.id)) return;
    const draft = `RISQUE STANDARD:\n${tool.risk_fr}\n\nMITIGATION SUGGÉRÉE:\n${tool.mitigation_fr}`;
    setSelectedTools(prev => [{ 
      id: tool.id, name: tool.tool_name, category: tool.category,
      draft_text: draft, context_note: '', status: 'draft'
    }, ...prev]);
    // Auto-switch to inventory tab to see it
    setActiveProjectTab('inventory');
  };

const removeTool = (index: number) => {
    // Removed the confirm() check to allow instant deletion
    const toolId = selectedTools[index].id;
    
    setSelectedTools(prev => prev.filter((_, i) => i !== index));
    
    // Cleanup dependent data automatically
    setDataFlows(prev => prev.filter(f => f.tool_id !== toolId));
    setRiskAssessments(prev => prev.filter(r => r.tool_id !== toolId));
  };

  // --- LOGIC: SAVE ---
  const handleSave = async () => {
    if (!clientName) return alert(t("Client name required", "Nom du client requis"));
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle();
    
    const { error } = await supabase.from('audits').insert({
      organization_id: member?.organization_id,
      user_id: user.id,
      client_name: clientName,
      project_scope: projectScope,
      checklist_data: { 
          type: 'msp_v3', 
          tools: selectedTools, 
          data_flows: dataFlows,
          risks: riskAssessments,
          decision: finalDecision
      },
      email: `${clientName.replace(/\s/g,'')}@audit.local`, url: 'https://internal.local', is_premium: true
    });

    if (!error) setLastSaved(new Date());
    else console.error(error);
    setSaving(false);
  };

  // --- RESIZING LOGIC ---
  const startResizingLeft = useCallback(() => setResizingSide('left'), []);
  const startResizingRight = useCallback(() => setResizingSide('right'), []);
  const stopResizing = useCallback(() => setResizingSide(null), []);
  const resize = useCallback((e: MouseEvent) => {
    if (resizingSide === 'left') {
      const w = e.clientX;
      if (w > 200 && w < window.innerWidth / 2) setLeftSidebarWidth(w);
    } else if (resizingSide === 'right') {
      const w = window.innerWidth - e.clientX;
      if (w > 300 && w < window.innerWidth / 2) setRightSidebarWidth(w);
    }
  }, [resizingSide]);

  useEffect(() => {
    if (resizingSide) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resizingSide, resize, stopResizing]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden select-none">
      
      {/* LEFT SIDEBAR */}
      <AssetSidebar width={leftSidebarWidth} onResizeStart={startResizingLeft} onAddTool={addTool} />

      {/* CENTER STAGE */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative border-r border-slate-200">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <ShieldAlert className="text-indigo-600" size={18} />
            <input 
              type="text" 
              placeholder={t('Project / Client Name...', 'Nom du Projet / Client...')} 
              className="font-bold text-slate-900 placeholder-slate-400 border-none focus:ring-0 p-0 w-full text-sm" 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-2">
                {lastSaved ? t('Saved', 'Sauvegardé') : t('Unsaved', 'Non sauvegardé')}
             </span>
             <button onClick={handleSave} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
               {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 pt-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {PROJECT_TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveProjectTab(tab.id)} 
              className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeProjectTab === tab.id 
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={14} /> {language === 'en' ? tab.labelEn : tab.labelFr}
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          
          {activeProjectTab === 'scope' && (
            <ProjectScopeTab scope={projectScope} onChange={setProjectScope} onSwitchToVault={() => {}} />
          )}
          
          {activeProjectTab === 'inventory' && (
            <SoftwareInventoryTab tools={selectedTools} onUpdateTools={setSelectedTools} onRemoveTool={removeTool} />
          )}

          {activeProjectTab === 'flows' && (
            <DataFlowsTab tools={selectedTools} flows={dataFlows} onUpdateFlows={setDataFlows} />
          )}

          {(activeProjectTab === 'risks' || activeProjectTab === 'mitigation') && (
            <RiskAnalysisTab tools={selectedTools} risks={riskAssessments} onUpdateRisks={setRiskAssessments} />
          )}
          
          {activeProjectTab === 'decision' && (
            <DecisionTab decision={finalDecision} onChange={setFinalDecision} />
          )}
          
          {activeProjectTab === 'report' && (
             <ReportTab 
                clientName={clientName}
                scope={projectScope}
                tools={selectedTools}
                flows={dataFlows}
                risks={riskAssessments}
                decision={finalDecision}
             />
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <IntelligenceSidebar width={rightSidebarWidth} onResizeStart={startResizingRight} />
    </div>
  );
}
