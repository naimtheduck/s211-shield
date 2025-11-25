import { create } from 'zustand';
import { Language } from './translations';

interface ScanResults {
  privacy_policy: string;
  cookie_consent: string;
  language_tag: string;
  scanned_at: string;
}

interface AuditState {
  language: Language;
  auditId: string | null;
  scanResults: ScanResults | null;
  checklistData: Record<string, unknown>;
  isPremium: boolean;
  isPremiumFlow: boolean;
  isLoggedIn: boolean; // <-- New state for auth
  isLoginModalOpen: boolean; // <-- New state for modal
  setLanguage: (lang: Language) => void;
  setAuditData: (data: {
    auditId: string;
    scanResults: ScanResults;
    checklistData?: Record<string, unknown>;
    isPremium?: boolean;
  }) => void;
  updateChecklistData: (data: Record<string, unknown>) => void;
  setPremiumFlow: (isPremium: boolean) => void;
  setIsLoggedIn: (status: boolean) => void; // <-- New setter
  setIsLoginModalOpen: (isOpen: boolean) => void; // <-- New setter
  reset: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  language: 'en',
  auditId: null,
  scanResults: null,
  checklistData: {},
  isPremium: false,
  isPremiumFlow: false,
  isLoggedIn: false, // <-- Default to false
  isLoginModalOpen: false, // <-- Default to false
  setLanguage: (lang) => set({ language: lang }),
  setAuditData: (data) =>
    set({
      auditId: data.auditId,
      scanResults: data.scanResults,
      checklistData: data.checklistData || {},
      isPremium: data.isPremium || false,
    }),
  updateChecklistData: (data) => set({ checklistData: data }),
  setPremiumFlow: (isPremium) => set({ isPremiumFlow: isPremium }),
  setIsLoggedIn: (status) => set({ isLoggedIn: status }), // <-- New setter implementation
  setIsLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }), // <-- New setter implementation
  reset: () =>
    set({
      auditId: null,
      scanResults: null,
      checklistData: {},
      isPremium: false,
      isPremiumFlow: false,
      isLoggedIn: false, // <-- Reset new state
    }),
}));