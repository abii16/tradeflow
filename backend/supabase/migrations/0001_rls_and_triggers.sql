-- 0001_rls_and_triggers.sql
-- Enterprise Auth, RLS, and Trigger implementations

-- 0. Schema Updates (Adding missing KYC fields and audit log fields)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fleet_name VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS operator_license VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_capacity VARCHAR(100);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_hash VARCHAR(255);

-- 0.1 Mock Auth schema for local dev if it doesn't exist (Supabase natively has this)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email varchar(255),
  raw_user_meta_data jsonb
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT null::uuid;
$$ LANGUAGE sql STABLE;

-- 1. Sync Trigger: auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    company_name, 
    tin_number, 
    trade_license, 
    badge_id,
    fleet_name,
    operator_license,
    vehicle_capacity,
    is_verified,
    verification_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CAST(COALESCE(NEW.raw_user_meta_data->>'role', 'SHIPPER') AS public.user_role),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'tin_number',
    NEW.raw_user_meta_data->>'trade_license',
    NEW.raw_user_meta_data->>'badge_id',
    NEW.raw_user_meta_data->>'fleet_name',
    NEW.raw_user_meta_data->>'operator_license',
    NEW.raw_user_meta_data->>'vehicle_capacity',
    false,
    'UNVERIFIED'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Enable RLS on core tables
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for loads (shipments are similar)
-- Select: Shippers can read own, Transporters/Forwarders read active, Customs read specific
CREATE POLICY "Shippers can view their own loads"
  ON public.loads FOR SELECT
  USING (auth.uid() = shipper_id);

CREATE POLICY "Verified Transporters and Forwarders can view active loads"
  ON public.loads FOR SELECT
  USING (
    status = 'POSTED' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (role = 'TRANSPORTER' OR role = 'FORWARDER') 
      AND verification_status = 'VERIFIED'
    )
  );

CREATE POLICY "Shippers can insert their own loads"
  ON public.loads FOR INSERT
  WITH CHECK (
    auth.uid() = shipper_id AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SHIPPER' AND verification_status = 'VERIFIED'
    )
  );

CREATE POLICY "Shippers can update their own loads"
  ON public.loads FOR UPDATE
  USING (auth.uid() = shipper_id)
  WITH CHECK (
    auth.uid() = shipper_id AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SHIPPER' AND verification_status = 'VERIFIED'
    )
  );

-- 4. RLS Policies for bids
CREATE POLICY "Transporters can view and create their own bids"
  ON public.bids FOR ALL
  USING (auth.uid() = transporter_id)
  WITH CHECK (
    auth.uid() = transporter_id AND 
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TRANSPORTER' AND verification_status = 'VERIFIED'
    )
  );

CREATE POLICY "Shippers can view bids on their loads"
  ON public.bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loads WHERE id = public.bids.load_id AND shipper_id = auth.uid()
    )
  );

-- 5. RLS Policies for customs_documents
CREATE POLICY "Public audit stream read for customs documents"
  ON public.customs_documents FOR SELECT
  USING (true);

CREATE POLICY "Customs Officers and Admins can mutate customs documents"
  ON public.customs_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'CUSTOMS_OFFICER' OR role = 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'CUSTOMS_OFFICER' OR role = 'ADMIN')
    )
  );

-- 6. RLS Policies for audit_logs
CREATE POLICY "Public audit stream read"
  ON public.audit_logs FOR SELECT
  USING (true);

CREATE POLICY "No modifications allowed on audit_logs"
  ON public.audit_logs FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No deletions allowed on audit_logs"
  ON public.audit_logs FOR DELETE
  USING (false);

-- System functions (like middleware using service role) bypass RLS for inserts
