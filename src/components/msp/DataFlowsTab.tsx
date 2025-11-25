import { useState } from 'react';
import { Network, ArrowRight, Globe, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SelectedTool {
  id: string;
  name: string;
  category: string;
}

interface DataFlow {
  tool_id: string;
  source: string;
  destination: string;
  is_cross_border: boolean;
  transfer_location: string;
  retention_period: string;
  deletion_mechanism: string;
  narrative: string; // Acts as "Notes" first, then "Final Text"
}

interface DataFlowsTabProps {
  tools: SelectedTool[];
  flows: DataFlow[];
  onUpdateFlows: (newFlows: DataFlow[]) => void;
}

export function DataFlowsTab({ tools, flows, onUpdateFlows }: DataFlowsTabProps) {
  const [activeToolId, setActiveToolId] = useState<string | null>(tools[0]?.id || null);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  // Helper to get or create flow for a tool
  const getFlow = (toolId: string): DataFlow => {
    return flows.find(f => f.tool_id === toolId) || {
      tool_id: toolId,
      source: 'Internal System',
      destination: 'Cloud Server',
      is_cross_border: false,
      transfer_location: 'Quebec',
      retention_period: 'Active + 1 Year',
      deletion_mechanism: 'Manual Deletion',
      narrative: ''
    };
  };

  const updateFlow = (toolId: string, field: keyof DataFlow, value: any) => {
    const currentFlow = getFlow(toolId);
    const updatedFlow = { ...currentFlow, [field]: value };
    
    // Remove old entry if exists and add new one
    const otherFlows = flows.filter(f => f.tool_id !== toolId);
    onUpdateFlows([...otherFlows, updatedFlow]);
  };

  const generateNarrative = async (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    const flow = getFlow(toolId);
    if (!tool) return;

    setLoadingAi(toolId);
    try {
      // We now include the EXISTING narrative (user notes) in the prompt
      const contextString = `
        Technical Notes: ${flow.narrative || 'None provided'}.
        Structured Data: Source: ${flow.source}, Dest: ${flow.destination}, Location: ${flow.transfer_location}, Retention: ${flow.retention_period}, Deletion: ${flow.deletion_mechanism}.
      `;

      const { data } = await supabase.functions.invoke('refine-draft', {
        body: { 
          tool_name: tool.name, 
          base_risk: "Data Flow Analysis", 
          user_context: contextString // <-- Passing the notes here
        }
      });
      
      if (data?.result) {
        updateFlow(toolId, 'narrative', data.result);
      }
    } catch (e) {
      alert("AI Error");
    } finally {
      setLoadingAi(null);
    }
  };

  return (
    <div className="flex h-full">
      {/* Tool Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Network size={14} /> System Components
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
          {tools.length === 0 && (
            <p className="text-xs text-slate-400 italic">No tools added in Inventory.</p>
          )}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeToolId && tools.find(t => t.id === activeToolId) ? (
          <div className="max-w-3xl mx-auto space-y-8">
            {(() => {
              const tool = tools.find(t => t.id === activeToolId)!;
              const flow = getFlow(activeToolId);
              
              return (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">{tool.name} Data Flow</h2>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase font-bold">{tool.category}</span>
                  </div>

                  {/* Flow Diagram Inputs */}
                  <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Source</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded text-sm"
                        value={flow.source}
                        onChange={e => updateFlow(activeToolId, 'source', e.target.value)}
                      />
                    </div>
                    <div className="flex justify-center text-slate-300">
                      <ArrowRight size={24} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination / Storage</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded text-sm"
                        value={flow.destination}
                        onChange={e => updateFlow(activeToolId, 'destination', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Compliance Checkbox Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Globe size={16} className="text-indigo-500" />
                          <h4 className="text-sm font-bold text-slate-700">Cross-Border Transfer</h4>
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input 
                              type="checkbox"
                              checked={flow.is_cross_border}
                              onChange={e => updateFlow(activeToolId, 'is_cross_border', e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Data leaves Quebec
                          </label>
                          {flow.is_cross_border && (
                            <input 
                              type="text"
                              placeholder="Location (e.g. AWS US-East)"
                              className="w-full p-2 border rounded text-sm"
                              value={flow.transfer_location}
                              onChange={e => updateFlow(activeToolId, 'transfer_location', e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border border-slate-200 rounded-xl">
                         <div className="flex items-center gap-2 mb-3">
                          <Clock size={16} className="text-indigo-500" />
                          <h4 className="text-sm font-bold text-slate-700">Lifecycle</h4>
                        </div>
                        <div className="space-y-3">
                           <div>
                            <label className="block text-xs text-slate-500 mb-1">Retention Period</label>
                            <input 
                              type="text"
                              className="w-full p-2 border rounded text-sm"
                              value={flow.retention_period}
                              onChange={e => updateFlow(activeToolId, 'retention_period', e.target.value)}
                            />
                           </div>
                           <div>
                            <label className="block text-xs text-slate-500 mb-1">Deletion Mechanism</label>
                            <input 
                              type="text"
                              className="w-full p-2 border rounded text-sm"
                              value={flow.deletion_mechanism}
                              onChange={e => updateFlow(activeToolId, 'deletion_mechanism', e.target.value)}
                            />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Narrative Generator */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700">Data Flow Narrative (For Report)</label>
                    </div>
                    <textarea 
                      className="w-full h-32 p-4 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      // Updated Placeholder to encourage input
                      placeholder="Add technical details here (e.g. 'Transfer via HTTPS', 'Encrypted with AES-256'). Then click Generate to create the final text."
                      value={flow.narrative}
                      onChange={e => updateFlow(activeToolId, 'narrative', e.target.value)}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Network size={48} className="mb-4 text-slate-200" />
            <p>Select a tool to map its data flow.</p>
          </div>
        )}
      </div>
    </div>
  );
}