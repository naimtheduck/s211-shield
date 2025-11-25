import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardStatsProps {
  total: number;
  highRisk: number;
  verified: number;
}

export function DashboardStats({ total, highRisk, verified }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Vendors */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Vendors</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="p-3 bg-slate-100 rounded-full text-slate-600">
          <Users size={20} />
        </div>
      </div>

      {/* High Risk (Red) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-red-500">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">High Risk Detected</p>
          <p className="text-3xl font-extrabold text-red-600 mt-1">{highRisk}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-full text-red-600 animate-pulse">
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* Verified (Green) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-green-500">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Verified Compliant</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">{verified}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-full text-green-600">
          <CheckCircle size={20} />
        </div>
      </div>
    </div>
  );
}