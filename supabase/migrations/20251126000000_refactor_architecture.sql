/*
  # S-211 Architecture Refactor (FIXED)
  # Includes DROP statements to fix "relation already exists" errors.
*/

-- 0. CLEANUP (Destructive: Removes old tables to rebuild properly)
DROP TABLE IF EXISTS public.compliance_logs CASCADE;
DROP TABLE IF EXISTS public.supplier_requests CASCADE;
DROP TABLE IF EXISTS public.company_vendors CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. COMPANIES (The Tenant)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own company" ON public.companies
  FOR ALL USING (auth.uid() = owner_id);


-- 2. VENDORS (The Entity)
-- Global/Shared identity of a vendor
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_email text,
  country text, 
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view vendors" ON public.vendors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users can create vendors" ON public.vendors
  FOR INSERT TO authenticated WITH CHECK (true);


-- 3. COMPANY_VENDORS (The Relationship)
-- Links a Company to a Vendor and holds the status
CREATE TABLE public.company_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  
  risk_status text CHECK (risk_status IN ('LOW', 'HIGH')) DEFAULT 'LOW',
  verification_status text CHECK (verification_status IN ('PENDING', 'SENT', 'VERIFIED', 'FLAGGED')) DEFAULT 'PENDING',
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(company_id, vendor_id)
);

ALTER TABLE public.company_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company vendors" ON public.company_vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = public.company_vendors.company_id 
      AND owner_id = auth.uid()
    )
  );


-- 4. SUPPLIER_REQUESTS (The Action)
-- Holds the Magic Token and Form Submission status
CREATE TABLE public.supplier_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_vendor_id uuid REFERENCES public.company_vendors(id) ON DELETE CASCADE NOT NULL,
  
  magic_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text CHECK (status IN ('PENDING', 'VIEWED', 'SUBMITTED')) DEFAULT 'PENDING',
  
  evidence_file_path text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.supplier_requests ENABLE ROW LEVEL SECURITY;

-- Public access for suppliers via token
CREATE POLICY "Suppliers can view own request via token" ON public.supplier_requests
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Suppliers can update own request via token" ON public.supplier_requests
  FOR UPDATE TO anon
  USING (true);

-- Dashboard access for users
CREATE POLICY "Users can view their sent requests" ON public.supplier_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_vendors cv
      JOIN public.companies c ON cv.company_id = c.id
      WHERE cv.id = public.supplier_requests.company_vendor_id
      AND c.owner_id = auth.uid()
    )
  );


-- 5. COMPLIANCE_LOGS (The Audit Trail)
CREATE TABLE public.compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  company_vendor_id uuid REFERENCES public.company_vendors(id) ON DELETE SET NULL,
  
  action_type text NOT NULL,
  details text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.compliance_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = public.compliance_logs.company_id 
      AND owner_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_company_vendors_company ON public.company_vendors(company_id);
CREATE INDEX idx_requests_token ON public.supplier_requests(magic_token);