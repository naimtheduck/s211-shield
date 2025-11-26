// src/lib/types.ts

export interface Company {
  id: string;
  name: string;
  owner_id: string;
}

export interface ReportingCycle {
  id: string;
  company_id: string;
  year: number;
  name: string;
  is_active: boolean;
}

export interface Vendor {
  id: string;
  company_name: string;
  contact_email: string;
  country: string;
}

// This is the main object for your Dashboard Table
export interface CompanyVendor {
  id: string; // The relationship ID
  company_id: string;
  vendor_id: string;
  reporting_cycle_id: string;
  
  // Statuses (Specific to this cycle)
  risk_status: 'LOW' | 'HIGH';
  verification_status: 'PENDING' | 'SENT' | 'VERIFIED' | 'FLAGGED';
  
  // Joined Data
  vendor: Vendor; 
  latest_request?: {
    status: string;
    magic_token: string;
    last_sent_at?: string;
  };
}

export interface ComplianceLog {
  id: string;
  action_type: string;
  details?: string;
  timestamp: string;
}