import { useState } from 'react';
import { FileText, Download, Sparkles, RefreshCw, AlertTriangle, CheckCircle, Globe, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProjectScope } from './ProjectScopeTab';
import { SelectedTool } from '../../pages/MSPAuditPage';
import { DataFlow } from './DataFlowsTab';
import { RiskAssessment } from './RiskAnalysisTab';
import { FinalDecision } from '../../pages/MSPAuditPage';

interface ReportTabProps {
  clientName: string;
  scope: ProjectScope;
  tools: SelectedTool[];
  flows: DataFlow[];
  risks: RiskAssessment[];
  decision: FinalDecision;
}

export function ReportTab({ clientName, scope, tools, flows, risks, decision }: ReportTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState('');
  
  // --- AI GENERATION ---
  const generateFullReport = async () => {
    setIsGenerating(true);
    try {
      // We package the entire state to send to the AI
      const contextData = {
        client: clientName,
        scope,
        tools: tools.map(t => t.name).join(', '),
        riskCount: risks.length,
        highRisks: risks.filter(r => r.residual_risk === 'High').length,
        decision: decision.approval_status
      };

      const { data } = await supabase.functions.invoke('generate-report-summary', {
        body: { context: contextData }
      });

      if (data?.summary) {
        setAiExecutiveSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate report summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- MOCK PDF DOWNLOAD ---
  const handleDownload = () => {
    alert("In a real app, this would generate a PDF file (using react-pdf or similar) containing the data below.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
         <div>
            <h2 className="text-lg font-bold text-slate-800">Final Audit Report</h2>
            <p className="text-xs text-slate-500">Review content before export.</p>
         </div>
         <div className="flex gap-3">
            <button 
                onClick={generateFullReport}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
                {isGenerating ? <RefreshCw size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                Generate AI Summary
            </button>
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
            >
                <Download size={16}/> Export PDF
            </button>
         </div>
      </div>

      {/* REPORT PREVIEW AREA (What the PDF will look like) */}
      <div className="bg-white shadow-lg border border-slate-200 min-h-[800px] p-12 mx-auto print:shadow-none print:border-none">
         
         {/* 1. Title Page Info */}
         <div className="border-b-2 border-slate-900 pb-8 mb-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Privacy Impact Assessment</h1>
                    <p className="text-xl text-slate-500 font-medium">{clientName || '[Client Name]'}</p>
                </div>
                <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border uppercase tracking-wider ${
                        decision.approval_status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        decision.approval_status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        {decision.approval_status === 'Approved' && <CheckCircle size={16}/>}
                        {decision.approval_status === 'Rejected' && <AlertTriangle size={16}/>}
                        {decision.approval_status === 'Conditional' && <AlertTriangle size={16}/>}
                        {decision.approval_status}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
         </div>

         {/* 2. Executive Summary (AI Generated) */}
         <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Executive Summary</h3>
            {aiExecutiveSummary ? (
                <div className="prose prose-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {aiExecutiveSummary}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-dashed border-slate-300 text-center">
                    <p className="text-slate-400 text-sm mb-3">No summary generated yet.</p>
                    <button onClick={generateFullReport} className="text-indigo-600 text-xs font-bold hover:underline">Generate with AI</button>
                </div>
            )}
         </div>

         {/* 3. Scope & Context */}
         <div className="mb-10 grid grid-cols-2 gap-8">
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Project Scope</h3>
                <p className="text-sm text-slate-700 mb-4">{scope.description || 'No description provided.'}</p>
                <div className="space-y-1">
                    <p className="text-xs"><span className="font-bold text-slate-900">Target Population:</span> <span className="text-slate-600">{scope.target_population}</span></p>
                    <p className="text-xs"><span className="font-bold text-slate-900">Data Types:</span> <span className="text-slate-600">{scope.data_types.join(', ')}</span></p>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">System Inventory</h3>
                <ul className="space-y-2">
                    {tools.map(tool => (
                        <li key={tool.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="font-bold text-slate-700">{tool.name}</span>
                            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border">{tool.category}</span>
                        </li>
                    ))}
                    {tools.length === 0 && <li className="text-xs text-slate-400 italic">No tools listed.</li>}
                </ul>
            </div>
         </div>

         {/* 4. Detailed Risk Analysis Table */}
         <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Risk Analysis & Controls</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Asset / Tool</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-1/3">Identified Risks</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-1/3">Mitigation Controls</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Data Loc.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {tools.map(tool => {
                            const risk = risks.find(r => r.tool_id === tool.id);
                            const flow = flows.find(f => f.tool_id === tool.id);
                            return (
                                <tr key={tool.id}>
                                    <td className="px-4 py-4 text-sm font-bold text-slate-900 align-top">{tool.name}</td>
                                    <td className="px-4 py-4 text-xs text-slate-600 align-top whitespace-pre-line">{risk?.risk_description || '-'}</td>
                                    <td className="px-4 py-4 text-xs text-slate-600 align-top whitespace-pre-line">{risk?.mitigation_strategy || '-'}</td>
                                    <td className="px-4 py-4 text-xs text-center align-top">
                                        {flow?.is_cross_border ? (
                                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                                                <Globe size={10}/> {flow.transfer_location || 'Foreign'}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                                <Shield size={10}/> QC/CA
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
         </div>

         {/* 5. Sign-off Block */}
         <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 mt-12">
            <h4 className="font-bold text-slate-900 mb-6">Attestation</h4>
            <p className="text-sm text-slate-600 mb-8 italic">
                "I confirm that the privacy risks associated with this project have been assessed and that the mitigation measures described above will be implemented."
            </p>
            
            <div className="grid grid-cols-2 gap-12">
                <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{decision.auditor_name || '____________________'}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Privacy Officer / Auditor</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Date</p>
                </div>
            </div>
         </div>

      </div>
    </div>
  );
}