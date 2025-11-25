import { LayoutDashboard, Upload } from 'lucide-react';
import { useAuditStore } from '../../lib/store';

export interface ProjectScope {
  description: string;
  sensitive_data: boolean;
  data_types: string[];
  target_population: string;
  additional_context: string;
}

interface ProjectScopeTabProps {
  scope: ProjectScope;
  onChange: (newScope: ProjectScope) => void;
  onSwitchToVault: () => void;
}

export function ProjectScopeTab({ scope, onChange, onSwitchToVault }: ProjectScopeTabProps) {
  const language = useAuditStore((state) => state.language);

  const t = {
    title: language === 'en' ? 'Project Definition' : 'Définition du Projet',
    descLabel: language === 'en' ? 'Project Description' : 'Description du Projet',
    descPlace: language === 'en' ? 'Ex: Implementation of Salesforce CRM for the sales team...' : 'Ex: Implantation d\'un nouveau CRM pour l\'équipe de vente...',
    popLabel: language === 'en' ? 'Target Population' : 'Population Cible',
    popPlace: language === 'en' ? 'Ex: Employees, Quebec Clients...' : 'Ex: Employés, Clients Québec...',
    dataLabel: language === 'en' ? 'Data Types' : 'Types de Données',
    dataPlace: language === 'en' ? 'Ex: Emails, SIN, Financial...' : 'Ex: Courriels, NAS, Financier...',
    contextLabel: language === 'en' ? 'Additional Context' : 'Contexte Supplémentaire',
    contextPlace: language === 'en' ? 'Any other details the AI should know?' : 'Autres détails pour l\'IA ?',
    sensitiveLabel: language === 'en' ? 'Sensitive Data?' : 'Données Sensibles ?',
    sensitiveDesc: language === 'en' ? 'Check if involves health, biometric, or highly sensitive financial data.' : 'Cochez si le projet implique des données de santé, biométriques ou financières.',
    vaultHint: language === 'en' ? 'You can upload context documents (PDFs) in the "Evidence" sidebar to assist the AI.' : 'Vous pouvez déposer des documents de contexte dans l\'onglet "Preuves" pour aider l\'IA.'
  };

  const updateField = (field: keyof ProjectScope, value: any) => {
    onChange({ ...scope, [field]: value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-indigo-500"/> {t.title}
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.descLabel}</label>
            <textarea 
              className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
              placeholder={t.descPlace}
              value={scope.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.popLabel}</label>
               <input 
                 type="text"
                 className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white"
                 placeholder={t.popPlace}
                 value={scope.target_population}
                 onChange={(e) => updateField('target_population', e.target.value)}
               />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.dataLabel}</label>
                 <input 
                 type="text"
                 className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white"
                 placeholder={t.dataPlace}
                 value={scope.data_types.join(', ')}
                 onChange={(e) => updateField('data_types', e.target.value.split(', '))}
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.contextLabel}</label>
            <textarea 
              className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white"
              placeholder={t.contextPlace}
              value={scope.additional_context}
              onChange={(e) => updateField('additional_context', e.target.value)}
            />
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
            <input 
              type="checkbox" 
              id="sensitive"
              checked={scope.sensitive_data}
              onChange={(e) => updateField('sensitive_data', e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <div>
                <label htmlFor="sensitive" className="text-sm font-bold text-indigo-900 cursor-pointer">{t.sensitiveLabel}</label>
                <p className="text-xs text-indigo-700 mt-1">{t.sensitiveDesc}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <button 
                onClick={onSwitchToVault}
                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-colors"
             >
                <Upload size={12}/> {t.vaultHint}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}