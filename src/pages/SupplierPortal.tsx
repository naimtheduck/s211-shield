import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, FileText, CheckCircle, Upload, Download, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupplierPortalProps {
  token: string;
}

export function SupplierPortal({ token }: SupplierPortalProps) {
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Form State
  const [forcedLabor, setForcedLabor] = useState(false);
  const [childLabor, setChildLabor] = useState(false);
  const [tier1Warranty, setTier1Warranty] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.');
      setLoading(false);
      return;
    }
    fetchVendor();
  }, [token]);

  const fetchVendor = async () => {
    // RLS Policy: "Vendors can read own data via token"
    const { data, error } = await supabase
      .from('vendors')
      .select('id, company_name, verification_status')
      .eq('magic_token', token)
      .single();

    if (error || !data) {
      setError('Access Denied. This link may have expired or is invalid.');
    } else {
      setVendor(data);
      if (data.verification_status === 'VERIFIED') setSubmitted(true);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!forcedLabor || !childLabor || !tier1Warranty) {
      alert('You must acknowledge all compliance statements to proceed.');
      return;
    }
    
    if (!file) {
      alert('Please upload the signed certification document.');
      return;
    }

    setLoading(true);

    try {
      // 2. Upload Evidence to Secure Bucket
      // Path format: vendor_id/timestamp_filename
      const filePath = `${vendor.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('compliance-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Update Vendor Status & Log It
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ 
          verification_status: 'VERIFIED',
          // If you have a column for the file path, save it here too
          // evidence_file: filePath 
        })
        .eq('magic_token', token);

      if (updateError) throw updateError;

      // 4. Create Audit Log Entry (The Defense)
      // Note: RLS must allow public insert to 'compliance_logs' if they have the token
      await supabase.from('compliance_logs').insert({
        vendor_id: vendor.id,
        action_type: 'SIGNED_DECLARATION',
        details: `Vendor uploaded: ${file.name}`
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: LOADING / ERROR ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 text-sm font-medium">Verifying secure link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-red-500 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // --- RENDER: SUCCESS STATE ---
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 px-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">Compliance Verified</h1>
          <p className="text-gray-600 mb-6">
            Thank you, <span className="font-bold text-gray-900">{vendor.company_name}</span>. 
            Your certification has been securely recorded.
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Reference ID: {vendor.id.slice(0, 8)}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN FORM ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Compliance Request</h1>
              <p className="text-blue-200 text-xs uppercase tracking-wider font-bold">Action Required</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">
            Vendor: <span className="text-white font-bold text-base ml-1">{vendor.company_name}</span>
          </p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Step 1: Download */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 text-sm">1. Download Code of Conduct</h3>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Review the Canada Bill S-211 standards regarding forced labour and child labour.
                  </p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 2: Checkboxes */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">2. Acknowledge & Certify</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                  checked={forcedLabor} 
                  onChange={e => setForcedLabor(e.target.checked)} 
                />
                <span className="text-sm text-gray-700">
                  I certify that our operations are free from forced labour and prison labour.
                </span>
              </label>
              
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                  checked={childLabor} 
                  onChange={e => setChildLabor(e.target.checked)} 
                />
                <span className="text-sm text-gray-700">
                  I certify that we verify the age of all workers and strictly prohibit child labour.
                </span>
              </label>

              {/* The "Pass the Buck" Clause */}
              <label className="flex items-start gap-3 p-3 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" 
                  checked={tier1Warranty} 
                  onChange={e => setTier1Warranty(e.target.checked)} 
                />
                <span className="text-sm text-gray-800 font-medium">
                  I warrant that we have exercised due diligence on our own direct suppliers regarding these risks.
                </span>
              </label>
            </div>
          </div>

          {/* Step 3: Upload */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">3. Upload Signed Copy</h3>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.png"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {file ? file.name : 'Click to upload signed document'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (Max 10MB)</p>
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : 'Submit Certification'}
          </button>
          
          <p className="text-center text-xs text-gray-400">
            Securely encrypted & timestamped for audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}