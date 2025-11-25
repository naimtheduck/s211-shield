import { useState } from 'react';
import { Bot, ArrowRight, RefreshCw } from 'lucide-react';

interface IntelligenceSidebarProps {
  width: number;
  onResizeStart: () => void;
}

export function IntelligenceSidebar({ width, onResizeStart }: IntelligenceSidebarProps) {
  const [mode, setMode] = useState<'researcher' | 'drafter'>('researcher');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const t = {
    expert: 'Expert (5.1)',
    drafter: 'Assistant',
    placeholder: 'Ask AI...',
    emptyResearch: 'Ask complex legal questions.',
    emptyDraft: 'Ask for drafting help.'
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    const newMsg = { role: 'user' as const, content: query };
    setHistory(prev => [...prev, newMsg]);
    setQuery('');
    setLoading(true);

    try {
      // Simulate API call - replace with your actual Supabase function
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHistory(prev => [...prev, { 
        role: 'ai', 
        content: 'This is a simulated response. Replace with actual supabase.functions.invoke call.'
      }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'ai', content: "Error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col bg-white border-l border-slate-200 z-10 shrink-0 shadow-lg relative h-full"
      style={{ width }}
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 active:bg-indigo-600 transition-colors z-50" 
        onMouseDown={onResizeStart} 
      />
      
      {/* Mode Selector */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex bg-slate-200 rounded p-1">
          <button 
            onClick={() => setMode('researcher')} 
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded shadow-sm transition-all ${
              mode === 'researcher' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.expert}
          </button>
          <button 
            onClick={() => setMode('drafter')} 
            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded shadow-sm transition-all ${
              mode === 'drafter' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.drafter}
          </button>
        </div>
      </div>

      {/* Input at Top - No scrolling needed! */}
      <div className="p-3 border-b border-slate-200 bg-white shrink-0">
        <div className="relative">
          <textarea 
            className="w-full pl-3 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-12"
            placeholder={t.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { 
              if(e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleQuery(); 
              } 
            }}
          />
          <button 
            onClick={handleQuery} 
            disabled={!query.trim() || loading} 
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {history.length === 0 && (
           <div className="text-center mt-10 opacity-50 px-4">
             <Bot size={32} className="mx-auto text-slate-300 mb-2" />
             <p className="text-xs text-slate-500 leading-relaxed">
               {mode === 'researcher' ? t.emptyResearch : t.emptyDraft}
             </p>
           </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-100 text-slate-800' 
                : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <RefreshCw size={12} className="animate-spin text-indigo-400"/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}