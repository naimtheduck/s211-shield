import { useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { useAuditStore } from '../lib/store';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ShieldCheck, CheckCircle, FileText, Globe, Lock } from 'lucide-react';

export function Landing() {
  const isLoggedIn = useAuditStore((state) => state.isLoggedIn);
  const setIsLoginModalOpen = useAuditStore((state) => state.setIsLoginModalOpen);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase mb-6">
              Bill S-211 Compliance
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              The Audit Defense Shield <br/> for Canadian CFOs.
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Generate the paper trail you need to protect your Board from liability—without disrupting your supply chain operations.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Compliance Audit
              </button>
              <button 
                className="px-8 py-4 bg-white text-slate-700 border border-slate-300 text-lg font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                View Sample Report
              </button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
              <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Tier-1 Verification</span>
              <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Immutable Audit Logs</span>
              <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Board-Ready PDF</span>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">The "Double Pincer" Problem</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-red-50 border border-red-100">
                <ShieldCheck className="w-10 h-10 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Regulatory Risk</h3>
                <p className="text-red-800/80">
                  Failing to report or making false statements carries a <strong>$250,000 fine</strong> and personal liability for Directors.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-amber-50 border border-amber-100">
                <Lock className="w-10 h-10 text-amber-600 mb-4" />
                <h3 className="text-xl font-bold text-amber-900 mb-2">Operational Risk</h3>
                <p className="text-amber-800/80">
                  If you find too much, the CBSA can seize your goods at the border. You need a <strong>defensible position</strong>, not deep mapping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 px-4 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">The "20-Minute" Defense Strategy</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Lazy Ingest</h3>
                <p className="text-slate-400 leading-relaxed">
                  Drag & drop your vendor list. We auto-flag high-risk suppliers (China, India, etc.) instantly.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. The Gatekeeper</h3>
                <p className="text-slate-400 leading-relaxed">
                  One click sends a "Compliance Gate" to vendors. They sign the liability waiver. You don't chase them.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Audit Defense</h3>
                <p className="text-slate-400 leading-relaxed">
                  We generate the immutable log proving "Steps Taken." Hand this to the Board and the Government.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}