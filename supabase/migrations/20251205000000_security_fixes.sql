-- ============================================
-- SECURITY FIX: RLS Policies for user_roles
-- ============================================
-- Priority: P0 CRITICAL
-- Description: Add Row Level Security to prevent unauthorized role modifications
-- ============================================

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Policy 1: Admins can manage all roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 2: Users can view their own roles (SELECT)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- PERFORMANCE: Add Database Indexes
-- ============================================
-- Priority: P1 HIGH
-- Description: Improve query performance with strategic indexes
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active) 
  WHERE active IS TRUE;

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON public.doctors(is_active) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_doctors_user ON public.doctors(user_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.doctors(id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_doctor ON public.availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.availability(day_of_week) 
  WHERE is_active = true;

-- Full-text search index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON public.profiles 
  USING gin(to_tsvector('spanish', full_name));

-- ============================================
-- SOFT DELETE: Add columns for soft deletion
-- ============================================
-- Priority: P0 CRITICAL
-- Description: Enable soft delete instead of hard delete
-- ============================================

-- Add soft delete columns to profiles if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for active profiles
CREATE INDEX IF NOT EXISTS idx_profiles_not_deleted ON public.profiles(active) 
  WHERE active = true;

-- Update existing profiles to be active
UPDATE public.profiles SET active = true WHERE active IS NULL;

-- ============================================
-- AUDIT LOG: Create admin audit table
-- ============================================
-- Priority: P1 HIGH
-- Description: Track all administrative actions
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs (system will do this)
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index on audit log
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log(created_at DESC);

-- ============================================
-- FUNCTION: Log admin actions
-- ============================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_user_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================
-- VALIDATION: Check for duplicate roles
-- ============================================

CREATE OR REPLACE FUNCTION public.check_duplicate_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = NEW.role
  ) THEN
    RAISE EXCEPTION 'User already has this role assigned';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_roles
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_role();

-- ============================================
-- VALIDATION: Prevent removing last role
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_removing_last_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_role_count
  FROM public.user_roles
  WHERE user_id = OLD.user_id;
  
  IF v_role_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last role from a user';
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_last_role_deletion
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_removing_last_role();

-- ============================================
-- Update RLS policies to respect soft delete
-- ============================================

-- Update profiles policies to exclude deleted users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles"
  ON public.profiles
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own active profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND active = true)
  WITH CHECK (auth.uid() = id AND active = true);

-- ============================================
-- Refresh materialized views and statistics
-- ============================================

ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.doctors;
ANALYZE public.appointments;
ANALYZE public.availability;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECURITY FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Applied:';
  RAISE NOTICE '  ✓ RLS policies on user_roles';
  RAISE NOTICE '  ✓ Database indexes for performance';
  RAISE NOTICE '  ✓ Soft delete columns and policies';
  RAISE NOTICE '  ✓ Admin audit log table';
  RAISE NOTICE '  ✓ Duplicate role prevention';
  RAISE NOTICE '  ✓ Last role deletion prevention';
  RAISE NOTICE '============================================';
END $$;
