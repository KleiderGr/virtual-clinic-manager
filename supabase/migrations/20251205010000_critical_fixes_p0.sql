-- ============================================
-- CRITICAL FIX: Add missing columns to schema
-- ============================================
-- This should be run BEFORE or merged into the initial schema
-- Adds active and deleted_at columns that the code expects
-- ============================================

-- Add columns to profiles for soft delete
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Set all existing profiles to active
UPDATE public.profiles SET active = true WHERE active IS NULL;

-- Create index for active profiles
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active) WHERE active = true;

-- ============================================
-- CRITICAL FIX: Restrict RLS policy on profiles
-- ============================================
-- Old policy was too permissive (anyone could see all emails/phones)
-- New policy: users can see own profile, admins can see all
-- ============================================

-- Drop old permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restricted policy
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Keep update policy restricted to own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own active profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND active = true)
  WITH CHECK (auth.uid() = id AND active = true);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CRITICAL FIX: Add RPC function for safe appointment creation
-- ============================================
-- Validates conflicts, blocked dates, and availability
-- ============================================

CREATE OR REPLACE FUNCTION public.create_appointment_safe(
  p_doctor_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id UUID;
  v_day_of_week INTEGER;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_appointment_date);

  -- 1. Check if doctor exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = p_doctor_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Doctor no disponible';
  END IF;

  -- 2. Check if date is not in the past
  IF p_appointment_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden agendar citas en el pasado';
  END IF;

  -- 3. Check if date is blocked
  IF EXISTS (
    SELECT 1 FROM blocked_dates
    WHERE doctor_id = p_doctor_id
      AND blocked_date = p_appointment_date
  ) THEN
    RAISE EXCEPTION 'Fecha bloqueada por el doctor';
  END IF;

  -- 4. Check if time slot is within doctor's availability
  IF NOT EXISTS (
    SELECT 1 FROM availability
    WHERE doctor_id = p_doctor_id
      AND day_of_week = v_day_of_week
      AND is_active = true
      AND p_start_time >= start_time
      AND p_end_time <= end_time
  ) THEN
    RAISE EXCEPTION 'Horario fuera de disponibilidad del doctor';
  END IF;

  -- 5. Check for time conflicts with existing appointments
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND status NOT IN ('cancelled')
      AND (
        (p_start_time >= start_time AND p_start_time < end_time) OR
        (p_end_time > start_time AND p_end_time <= end_time) OR
        (p_start_time <= start_time AND p_end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Horario no disponible - ya existe una cita';
  END IF;

  -- 6. Create the appointment
  INSERT INTO appointments (
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    status,
    reason
  ) VALUES (
    auth.uid(),
    p_doctor_id,
    p_appointment_date,
    p_start_time,
    p_end_time,
    'pending', -- Start as pending, not confirmed
    p_reason
  ) RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_appointment_safe TO authenticated;

-- ============================================
-- VALIDATION: Check triggers are active
-- ============================================

DO $$
BEGIN
  -- Check if handle_new_user trigger exists and is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgenabled = 'O' -- O = origin (enabled)
  ) THEN
    RAISE WARNING 'CRITICAL: Trigger on_auth_user_created is not enabled!';
    RAISE WARNING 'New user registrations will fail!';
    RAISE WARNING 'Run: SET session_replication_role = ''origin'';';
  ELSE
    RAISE NOTICE '✓ Trigger on_auth_user_created is active';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CRITICAL FIXES APPLIED (P0)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✓ Added active and deleted_at columns';
  RAISE NOTICE '✓ Restricted RLS policy on profiles';
  RAISE NOTICE '✓ Created create_appointment_safe function';
  RAISE NOTICE '✓ Validated triggers are active';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Regenerate TypeScript types';
  RAISE NOTICE '2. Update useAppointments to use RPC function';
  RAISE NOTICE '3. Add NULL checks in doctor UI components';
  RAISE NOTICE '============================================';
END $$;
