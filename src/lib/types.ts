// src/types.ts

export interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  country: string;
  risk_status: 'LOW' | 'HIGH'; 
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED' | 'FLAGGED';
  magic_token: string;
  created_at: string;
}

export interface ComplianceLog {
  id: string;
  vendor_id: string;
  action_type: 'EMAIL_SENT' | 'VIEWED_PORTAL' | 'SIGNED_DECLARATION';
  details?: string;
  timestamp: string;
}