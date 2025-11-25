import { useState } from 'react';
import { List, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SelectedTool } from '../../pages/MSPAuditPage';

interface SoftwareInventoryTabProps {
  tools: SelectedTool[];
  onUpdateTools: (tools: SelectedTool[]) => void;
  onRemoveTool: (index: number) => void;
}

export function SoftwareInventoryTab({ tools, onUpdateTools, onRemoveTool }: SoftwareInventoryTabProps) {
  const [refiningIndex, setRefiningIndex] = useState<number | null>(null);

  const updateTool = (index: number, field: keyof SelectedTool, value: any) => {
    const newTools = [...tools];
    (newTools[index] as any)[field] = value;
    onUpdateTools(newTools);
  };

  const handleRefineTool = async (index: number) => {
    const tool = tools[index];
    if (!tool.context_note) return alert("Please add client context before refining.");
    
    setRefiningIndex(index);
    try {
      const { data } = await supabase.functions.invoke('refine-draft', {
        body: { tool_name: tool.name, base_risk: tool.draft_text, user_context: tool.context_note }
      });
      if (data?.result) {
        updateTool(index, 'draft_text', data.result);
      }
    } catch (e) { alert("AI Error"); }
    finally { setRefiningIndex(null); }
  };

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed border-slate-200 rounded-xl bg-white">
        <List size={48} className="mb-4 text-slate-300"/>
        <p className="text-slate-400">Use the Library on the left to add software.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {tools.map((tool, idx) => (
        <div key={`${tool.id}-${idx}`} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden group">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-700">{tool.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase font-bold">{tool.category}</span>
            </div>
            <button onClick={() => onRemoveTool(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
          </div>
          
          <div className="flex flex-col md:flex-row h-72 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left Column: Inputs */}
            <div className="md:w-1/3 p-3 bg-slate-50/50 flex flex-col gap-3">
                
                {/* Data Types Input */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Elements (What is stored?)</label>
                    <input 
                        className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-indigo-400"
                        placeholder="e.g. Names, Emails, SIN, Credit Cards..."
                        value={tool.data_types || ''}
                        onChange={(e) => updateTool(idx, 'data_types', e.target.value)}
                    />
                </div>

                {/* Context Input */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Usage Context</label>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-white border border-slate-200 rounded p-2 text-xs resize-none focus:border-indigo-400 outline-none"
                        placeholder="How is this used? (e.g. Cloud version, 2FA enabled, limited access...)"
                        value={tool.context_note}
                        onChange={(e) => updateTool(idx, 'context_note', e.target.value)}
                    />
                </div>
            </div>

            {/* Right Column: AI Output */}
            <div className="md:w-2/3 p-0 relative group">
                <textarea 
                    className="w-full h-full p-4 text-sm font-mono text-slate-600 resize-none focus:outline-none leading-relaxed"
                    value={tool.draft_text}
                    onChange={(e) => updateTool(idx, 'draft_text', e.target.value)}
                />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
