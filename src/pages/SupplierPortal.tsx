// src/pages/SupplierPortal.tsx

import { useState, useEffect } from 'react';
import { Shield, Upload, CheckCircle, FileText, AlertTriangle, Loader2, ChevronDown, ChevronUp, Eye, X, ArrowRight, Trash2, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PortalData {
  company_name: string;
  vendor_name: string;
  cocUrl: string | null;
  status: string;
}

export function SupplierPortal() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PortalData | null>(null);
  
  // Form States
  const [agreed, setAgreed] = useState(false);
  
  // MULTI-FILE STATE
  const [files, setFiles] = useState<File[]>([]); 
  
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isDocOpen, setIsDocOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid access link or missing token.");
      setLoading(false);
      return;
    }
    initPortal();
  }, [token]);

  const initPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('portal-init', { body: { token } });
      
      if (error || (data && !data.success)) {
        throw new Error(data?.error || error?.message || "Connection failed");
      }
      
      setData(data.data);
      if (data.data.status === 'SUBMITTED' || data.data.status === 'VERIFIED') {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Append new files to existing list
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !agreed || !data) return;
    
    setUploading(true);
    const uploadedPaths: string[] = [];

    try {
      // 1. Loop through files and upload each
      for (const file of files) {
        // A. Get Signed URL for THIS file
        const { data: signData, error: signError } = await supabase.functions.invoke('portal-upload-url', {
          body: { token, filename: file.name }
        });

        if (signError || !signData.success) {
          throw new Error(`Failed to initialize upload for ${file.name}`);
        }

        // B. Upload to Storage
        const uploadRes = await fetch(signData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}`);
        
        uploadedPaths.push(signData.path);
      }

      // 2. Submit all paths to DB
      const { error: submitError, data: submitData } = await supabase.functions.invoke('portal-submit', {
        body: { 
          token, 
          filePaths: uploadedPaths, // <--- Sending Array
          additionalInfo 
        }
      });

      if (submitError || (submitData && !submitData.success)) {
        throw new Error(submitData?.error || "Submission failed on server");
      }

      setSuccess(true);
      toast.success("All documents submitted successfully!");

    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // ... (Keep existing loading/error/success renders) ...
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-slate-900 w-8 h-8" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">...Error UI...</div>; // Use your existing error UI
  if (success) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">...Everything was submitted, you can close it now...</div>; // Use your existing success UI

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">S-211 Shield</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Compliance Verification</h1>
            <p className="text-slate-500 text-lg">Requested by <span className="font-semibold text-slate-900">{data?.company_name}</span></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-1.5 bg-gray-100 w-full">
            <div className="h-full bg-slate-900 w-[50%]"></div>
          </div>

          <div className="p-8 space-y-10">
            
            {/* ... (Keep Section 1: Review Standards as is) ... */}
            {/* Section 1 Placeholder for brevity - insert your existing Section 1 code here */}
             <section>
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">1</span>
                    <h2 className="text-lg font-bold text-slate-900">Review Standards</h2>
                </div>
                <div onClick={() => setIsDocOpen(true)} className="group border border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all cursor-pointer bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><FileText size={24} /></div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Supplier Code of Conduct</p>
                            <p className="text-sm text-slate-500">Click to review</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all"><Eye size={16} /> View</div>
                </div>
                <div className="mt-4 pl-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-600 leading-relaxed pt-0.5 group-hover:text-slate-900 transition-colors">I certify that <strong>{data?.vendor_name}</strong> has reviewed the Code of Conduct...</span>
                    </label>
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* Section 2: Multi-File Upload */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">2</span>
                        <h2 className="text-lg font-bold text-slate-900">Upload Evidence</h2>
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">Required</span>
                </div>

                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all text-center">
                    <input 
                        type="file" 
                        multiple // <--- ENABLE MULTIPLE
                        accept=".pdf,.jpg,.png" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileSelect}
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                        <div className="bg-gray-100 p-3 rounded-full text-gray-500 mb-3">
                            <Upload size={24} />
                        </div>
                        <p className="font-bold text-slate-900">Click to upload documents</p>
                        <p className="text-sm text-slate-500 mt-1">S-211 Report, Policy, or Certifications</p>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((f, index) => (
                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded"><Paperclip size={16} /></div>
                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{f.name}</span>
                                    <span className="text-xs text-slate-400">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6">
                     <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        {showDetails ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        {showDetails ? 'Hide notes' : 'Add optional notes'}
                    </button>
                    {showDetails && (
                        <div className="mt-3 animate-in slide-in-from-top-2">
                            <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="E.g., We are currently undergoing a Sedex audit..." className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-gray-50" rows={3} />
                        </div>
                    )}
                </div>
            </section>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!agreed || files.length === 0 || uploading}
                className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
                {uploading ? <><Loader2 className="animate-spin" size={24}/> Submitting...</> : <>Submit Verification <ArrowRight size={20} /></>}
            </button>

            {/* Escape Hatch */}
            <div className="text-center mt-2">
                <a 
                    href={`mailto:compliance@${data?.company_name.replace(/\s+/g, '').toLowerCase()}.com`}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                    Cannot certify? Contact us directly.
                </a>
            </div>

          </div>
        </div>
      </main>
      
      {/* ... (Keep PDF Modal) ... */}
      {isDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> Supplier Code of Conduct</h3>
              <button onClick={() => setIsDocOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                src={data?.cocUrl ? `${data.cocUrl}#toolbar=0&navpanes=0&view=FitH` : ''} 
                className="w-full h-full" 
                title="Code of Conduct" 
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button onClick={() => setIsDocOpen(false)} className="text-slate-600 font-bold px-4 py-2 hover:bg-gray-50 rounded-lg">Close</button>
              <button onClick={() => { setIsDocOpen(false); setAgreed(true); }} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm">I Agree & Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}