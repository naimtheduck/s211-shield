import { useState, useEffect } from 'react';
import { Search, BookOpen, Paperclip, Plus, FileText, Upload, CheckCircle } from 'lucide-react';
import { useAuditStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

// Types needed
interface RiskTool {
  id: string;
  tool_name: string;
  category: string;
  risk_fr: string;
  mitigation_fr: string;
  last_verified?: string;
}

interface Document {
  id: string;
  name: string;
  created_at: string;
}

interface AssetSidebarProps {
  width: number;
  onResizeStart: () => void;
  onAddTool: (tool: RiskTool) => void;
}

export function AssetSidebar({ width, onResizeStart, onAddTool }: AssetSidebarProps) {
  const language = useAuditStore((state) => state.language);
  const [activeTab, setActiveTab] = useState<'library' | 'vault'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [library, setLibrary] = useState<RiskTool[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Labels
  const t = {
    library: language === 'en' ? 'Library' : 'Librairie',
    evidence: language === 'en' ? 'Evidence' : 'Preuves',
    search: language === 'en' ? 'Search tools...' : 'Rechercher...',
    upload: language === 'en' ? 'Upload PDF' : 'Téléverser PDF',
    verified: language === 'en' ? 'Verified' : 'Vérifié'
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: lib } = await supabase.from('risk_library').select('*').order('tool_name');
      if (lib) setLibrary(lib as RiskTool[]);
      // Mock Docs
      setDocuments([{ id: '1', name: 'Security_Policy.pdf', created_at: new Date().toISOString() }]);
    };
    fetchData();
  }, []);

  const filteredLibrary = library.filter(t => t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div 
      className="flex flex-col bg-white border-r border-slate-200 z-20 shadow-xl shrink-0 relative h-full"
      style={{ width }}
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 shrink-0">
        <button onClick={() => setActiveTab('library')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'library' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
          <BookOpen size={14} /> {t.library}
        </button>
        <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'vault' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Paperclip size={14} /> {t.evidence}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
        {activeTab === 'library' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder={t.search}
                className="w-full pl-8 p-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {filteredLibrary.map(tool => (
                <div key={tool.id} onClick={() => onAddTool(tool)} className="bg-white p-2.5 rounded border border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer group transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 text-xs">{tool.tool_name}</span>
                    <Plus size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="flex justify-between mt-1">
                     <span className="text-[9px] text-slate-400 uppercase font-bold">{tool.category}</span>
                     {tool.last_verified && <span className="text-[9px] text-green-600 flex items-center gap-0.5"><CheckCircle size={8}/> {t.verified}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-indigo-50">
                <FileText size={16} className="text-slate-400" />
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-700 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            <div className="mt-auto pt-4 border-t border-slate-200">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-white transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <p className="text-[10px] text-slate-500">{t.upload}</p>
                </div>
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Drag Handle */}
      <div className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-50" onMouseDown={onResizeStart} />
    </div>
  );
}