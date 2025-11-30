-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  subscription_status text DEFAULT 'free'::text,
  stripe_customer_id text,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.company_vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporting_cycle_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  risk_status text DEFAULT 'LOW'::text CHECK (risk_status = ANY (ARRAY['LOW'::text, 'HIGH'::text])),
  verification_status text DEFAULT 'PENDING'::text CHECK (verification_status = ANY (ARRAY['PENDING'::text, 'SENT'::text, 'VERIFIED'::text, 'FLAGGED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_vendors_pkey PRIMARY KEY (id),
  CONSTRAINT company_vendors_reporting_cycle_id_fkey FOREIGN KEY (reporting_cycle_id) REFERENCES public.reporting_cycles(id),
  CONSTRAINT company_vendors_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.compliance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  reporting_cycle_id uuid,
  company_vendor_id uuid,
  action_type text NOT NULL,
  details text,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_logs_pkey PRIMARY KEY (id),
  CONSTRAINT compliance_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT compliance_logs_reporting_cycle_id_fkey FOREIGN KEY (reporting_cycle_id) REFERENCES public.reporting_cycles(id),
  CONSTRAINT compliance_logs_company_vendor_id_fkey FOREIGN KEY (company_vendor_id) REFERENCES public.company_vendors(id)
);
CREATE TABLE public.organization_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member'::text,
  token text DEFAULT encode(gen_random_bytes(16), 'hex'::text) UNIQUE,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_invites_pkey PRIMARY KEY (id),
  CONSTRAINT organization_invites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text DEFAULT 'admin'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reporting_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  year integer NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reporting_cycles_pkey PRIMARY KEY (id),
  CONSTRAINT reporting_cycles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.supplier_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_vendor_id uuid NOT NULL,
  magic_token text DEFAULT encode(gen_random_bytes(16), 'hex'::text) UNIQUE,
  expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'VIEWED'::text, 'SUBMITTED'::text])),
  evidence_files jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT supplier_requests_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_requests_company_vendor_id_fkey FOREIGN KEY (company_vendor_id) REFERENCES public.company_vendors(id)
);
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_email text,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);