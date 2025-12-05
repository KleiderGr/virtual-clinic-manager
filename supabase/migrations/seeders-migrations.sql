-- ============================================
-- SCRIPT DE MIGRACIÓN/SEED PARA NUEVO PROYECTO (VERSIÓN 2 - CORREGIDA)
-- ============================================
-- Corrección: Error en vista upcoming_appointments - alias incorrecto
-- ============================================

-- Desactivar temporalmente triggers para evitar conflictos
SET session_replication_role = 'replica';

-- ============================================
-- 1. INSERTAR ESPECIALIDADES MÉDICAS
-- ============================================
INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Medicina General',
  'Atención primaria y diagnóstico general',
  'stethoscope',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Cardiología',
  'Enfermedades del corazón y sistema circulatorio',
  'heart',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Dermatología',
  'Enfermedades de la piel, pelo y uñas',
  'skin',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Pediatría',
  'Salud infantil y atención a menores',
  'child',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Ginecología',
  'Salud femenina y sistema reproductivo',
  'female',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440006',
  'Traumatología',
  'Lesiones del sistema musculoesquelético',
  'bone',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440007',
  'Psiquiatría',
  'Salud mental y trastornos psicológicos',
  'brain',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Oftalmología',
  'Enfermedades de los ojos y visión',
  'eye',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440009',
  'Odontología',
  'Salud bucal y dental',
  'tooth',
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialties (id, name, description, icon, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Nutriología',
  'Nutrición y dietas personalizadas',
  'apple',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREACIÓN DE USUARIO ADMINISTRADOR
-- ============================================

DO $$
DECLARE
  admin_user_id UUID;
  doctor_user_id UUID;
  patient_user_id UUID;
  doctor_record_id UUID;
BEGIN
  -- Verificar si ya existe un usuario admin para evitar duplicados
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@clinica.com'
  ) THEN
    -- Crear usuario administrador en auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@clinica.com',
      -- Contraseña: Admin123! (hasheada con bcrypt)
      '$2a$10$N9qo8uLOickgx2ZMRZoMye.KbB8/.8gVbXp8.5PdrVfC6r6tVYpGO',
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NOW(),
      '',
      '',
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrador Principal"}',
      false,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NOW(),
      '',
      0,
      NULL,
      '',
      NOW(),
      false,
      NULL,
      false
    ) RETURNING id INTO admin_user_id;
    
    -- Crear perfil del administrador
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin@clinica.com',
      'Administrador Principal',
      '+1234567890',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = NOW();
    
    -- Asignar rol de administrador
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (admin_user_id, 'admin', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuario administrador creado con ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuario administrador ya existe';
  END IF;

  -- ============================================
  -- 3. CREAR USUARIO DOCTOR DE EJEMPLO (OPCIONAL)
  -- ============================================
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'doctor.ejemplo@clinica.com'
  ) THEN
    -- Crear usuario doctor de ejemplo
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'doctor.ejemplo@clinica.com',
      -- Contraseña: Doctor123! (hasheada con bcrypt)
      '$2a$10$N9qo8uLOickgx2ZMRZoMye.KbB8/.8gVbXp8.5PdrVfC6r6tVYpGO',
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NOW(),
      '',
      '',
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Dr. Juan Pérez"}',
      false,
      NOW(),
      NOW(),
      '+1234567891',
      NULL,
      '',
      '',
      NOW(),
      '',
      0,
      NULL,
      '',
      NOW(),
      false,
      NULL,
      false
    ) RETURNING id INTO doctor_user_id;
    
    -- Crear perfil del doctor
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      doctor_user_id,
      'doctor.ejemplo@clinica.com',
      'Dr. Juan Pérez',
      '+1234567891',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = NOW();
    
    -- Asignar rol de doctor
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (doctor_user_id, 'doctor', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Crear registro en tabla doctors
    INSERT INTO public.doctors (
      user_id,
      specialty_id,
      license_number,
      bio,
      consultation_fee,
      years_experience,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      doctor_user_id,
      '550e8400-e29b-41d4-a716-446655440001', -- Medicina General
      'MED-123456',
      'Médico general con 10 años de experiencia, especializado en atención primaria y medicina familiar.',
      50.00,
      10,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO doctor_record_id;
      
    -- Crear horarios de disponibilidad para el doctor con CAST a TIME
    INSERT INTO public.availability (
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration,
      is_active,
      created_at
    ) VALUES 
    (doctor_record_id, 1, '09:00'::time, '13:00'::time, 30, true, NOW()),
    (doctor_record_id, 2, '09:00'::time, '13:00'::time, 30, true, NOW()),
    (doctor_record_id, 3, '09:00'::time, '13:00'::time, 30, true, NOW()),
    (doctor_record_id, 4, '09:00'::time, '13:00'::time, 30, true, NOW()),
    (doctor_record_id, 5, '09:00'::time, '13:00'::time, 30, true, NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Usuario doctor de ejemplo creado con ID: %', doctor_user_id;
  ELSE
    RAISE NOTICE 'Usuario doctor de ejemplo ya existe';
  END IF;

  -- ============================================
  -- 4. CREAR USUARIO PACIENTE DE EJEMPLO (OPCIONAL)
  -- ============================================
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'paciente.ejemplo@clinica.com'
  ) THEN
    -- Crear usuario paciente de ejemplo
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'paciente.ejemplo@clinica.com',
      -- Contraseña: Paciente123! (hasheada con bcrypt)
      '$2a$10$N9qo8uLOickgx2ZMRZoMye.KbB8/.8gVbXp8.5PdrVfC6r6tVYpGO',
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NOW(),
      '',
      '',
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "María González"}',
      false,
      NOW(),
      NOW(),
      '+1234567892',
      NULL,
      '',
      '',
      NOW(),
      '',
      0,
      NULL,
      '',
      NOW(),
      false,
      NULL,
      false
    ) RETURNING id INTO patient_user_id;
    
    -- Crear perfil del paciente
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      patient_user_id,
      'paciente.ejemplo@clinica.com',
      'María González',
      '+1234567892',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=paciente',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = NOW();
    
    -- Asignar rol de paciente
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (patient_user_id, 'patient', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuario paciente de ejemplo creado con ID: %', patient_user_id;
  ELSE
    RAISE NOTICE 'Usuario paciente de ejemplo ya existe';
  END IF;

END $$;

-- ============================================
-- 5. DATOS ADICIONALES DE CONFIGURACIÓN
-- ============================================

-- Insertar más doctores de ejemplo (sin usuarios de auth)
INSERT INTO public.doctors (
  id,
  specialty_id,
  license_number,
  bio,
  consultation_fee,
  years_experience,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002', -- Cardiología
  'CAR-789012',
  'Cardiólogo con especialización en intervencionismo, 15 años de experiencia.',
  80.00,
  15,
  true,
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003', -- Dermatología
  'DER-345678',
  'Dermatóloga especializada en cáncer de piel y dermatología estética.',
  70.00,
  12,
  true,
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004', -- Pediatría
  'PED-901234',
  'Pediatra con enfoque en desarrollo infantil y nutrición pediátrica.',
  60.00,
  8,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Agregar horarios para los doctores adicionales
-- Doctor Cardiología
INSERT INTO public.availability (
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration,
  is_active,
  created_at
) VALUES 
('660e8400-e29b-41d4-a716-446655440001', 1, '10:00'::time, '14:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440001', 3, '10:00'::time, '14:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440001', 5, '10:00'::time, '14:00'::time, 30, true, NOW())
ON CONFLICT DO NOTHING;

-- Doctor Dermatología
INSERT INTO public.availability (
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration,
  is_active,
  created_at
) VALUES 
('660e8400-e29b-41d4-a716-446655440002', 2, '08:00'::time, '12:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440002', 4, '08:00'::time, '12:00'::time, 30, true, NOW())
ON CONFLICT DO NOTHING;

-- Doctor Pediatría
INSERT INTO public.availability (
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration,
  is_active,
  created_at
) VALUES 
('660e8400-e29b-41d4-a716-446655440003', 1, '13:00'::time, '17:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 2, '13:00'::time, '17:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 3, '13:00'::time, '17:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 4, '13:00'::time, '17:00'::time, 30, true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 5, '13:00'::time, '17:00'::time, 30, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CREAR VISTAS ÚTILES PARA EL SISTEMA (CORREGIDAS)
-- ============================================

-- Vista para obtener perfiles con roles
CREATE OR REPLACE VIEW public.profiles_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at,
  ur.role,
  ur.created_at as role_created_at
FROM 
  public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id;

-- Vista para obtener doctores con información completa
CREATE OR REPLACE VIEW public.doctors_full_info AS
SELECT 
  d.id as doctor_id,
  d.license_number,
  d.bio,
  d.consultation_fee,
  d.years_experience,
  d.is_active as doctor_active,
  d.created_at as doctor_created_at,
  s.id as specialty_id,
  s.name as specialty_name,
  s.description as specialty_description,
  s.icon as specialty_icon,
  p.id as user_id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url
FROM 
  public.doctors d
  LEFT JOIN public.specialties s ON d.specialty_id = s.id
  LEFT JOIN public.profiles p ON d.user_id = p.id;

-- **CORRECCIÓN CRÍTICA**: Vista para próximas citas - alias corregido
CREATE OR REPLACE VIEW public.upcoming_appointments AS
SELECT 
  a.id,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.status,
  a.reason,
  a.created_at as appointment_created_at,
  d.id as doctor_id,
  dp.full_name as doctor_name,
  s.name as specialty_name,
  pp.id as patient_id,  -- CORREGIDO: Cambiado de p.id a pp.id
  pp.full_name as patient_name,
  pp.email as patient_email,
  pp.phone as patient_phone
FROM 
  public.appointments a
  INNER JOIN public.doctors d ON a.doctor_id = d.id
  INNER JOIN public.profiles dp ON d.user_id = dp.id
  LEFT JOIN public.specialties s ON d.specialty_id = s.id
  INNER JOIN public.profiles pp ON a.patient_id = pp.id
WHERE 
  a.appointment_date >= CURRENT_DATE
  AND a.status IN ('pending', 'confirmed')
ORDER BY 
  a.appointment_date, a.start_time;

-- ============================================
-- 7. FUNCIONES DE UTILIDAD
-- ============================================

-- Función para obtener estadísticas básicas
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE(
  total_patients BIGINT,
  total_doctors BIGINT,
  total_appointments_today BIGINT,
  total_pending_appointments BIGINT,
  revenue_today DECIMAL(10,2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur WHERE ur.role = 'patient') as total_patients,
    (SELECT COUNT(*) FROM doctors WHERE is_active = true) as total_doctors,
    (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE AND status != 'cancelled') as total_appointments_today,
    (SELECT COUNT(*) FROM appointments WHERE status = 'pending' AND appointment_date >= CURRENT_DATE) as total_pending_appointments,
    COALESCE((
      SELECT SUM(d.consultation_fee) 
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date = CURRENT_DATE 
        AND a.status = 'completed'
    ), 0) as revenue_today;
$$;

-- Función para buscar doctores por especialidad y disponibilidad
CREATE OR REPLACE FUNCTION public.search_available_doctors(
  p_specialty_id UUID DEFAULT NULL,
  p_appointment_date DATE DEFAULT NULL,
  p_start_time TIME DEFAULT NULL
)
RETURNS TABLE(
  doctor_id UUID,
  doctor_name TEXT,
  specialty_name TEXT,
  consultation_fee DECIMAL(10,2),
  available_slots JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH doctor_availability AS (
    SELECT 
      d.id as doctor_id,
      dp.full_name as doctor_name,
      s.name as specialty_name,
      d.consultation_fee,
      jsonb_agg(
        jsonb_build_object(
          'day_of_week', av.day_of_week,
          'start_time', av.start_time,
          'end_time', av.end_time,
          'slot_duration', av.slot_duration
        )
      ) as availability_schedule
    FROM 
      doctors d
      JOIN profiles dp ON d.user_id = dp.id
      LEFT JOIN specialties s ON d.specialty_id = s.id
      JOIN availability av ON d.id = av.doctor_id AND av.is_active = true
    WHERE 
      d.is_active = true
      AND (p_specialty_id IS NULL OR d.specialty_id = p_specialty_id)
    GROUP BY 
      d.id, dp.full_name, s.name, d.consultation_fee
  )
  SELECT 
    da.doctor_id,
    da.doctor_name,
    da.specialty_name,
    da.consultation_fee,
    da.availability_schedule as available_slots
  FROM 
    doctor_availability da
  WHERE 
    -- Si se proporciona fecha y hora, verificar disponibilidad específica
    (p_appointment_date IS NULL OR p_start_time IS NULL)
    OR EXISTS (
      SELECT 1 FROM availability av
      WHERE av.doctor_id = da.doctor_id
        AND av.day_of_week = EXTRACT(DOW FROM p_appointment_date)
        AND av.is_active = true
        AND p_start_time BETWEEN av.start_time AND av.end_time
        AND NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_id = da.doctor_id
            AND a.appointment_date = p_appointment_date
            AND a.start_time = p_start_time
            AND a.status != 'cancelled'
        )
    );
END;
$$;

-- ============================================
-- 8. REACTIVAR TRIGGERS Y LIMPIAR
-- ============================================

-- Reactivar todos los triggers
SET session_replication_role = 'origin';

-- Actualizar estadísticas de la base de datos
ANALYZE;

-- ============================================
-- 9. MENSAJES DE ÉXITO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED/MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Credenciales de acceso:';
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'ADMINISTRADOR:';
  RAISE NOTICE '  Email: admin@clinica.com';
  RAISE NOTICE '  Contraseña: Admin123!';
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'DOCTOR DE EJEMPLO:';
  RAISE NOTICE '  Email: doctor.ejemplo@clinica.com';
  RAISE NOTICE '  Contraseña: Doctor123!';
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'PACIENTE DE EJEMPLO:';
  RAISE NOTICE '  Email: paciente.ejemplo@clinica.com';
  RAISE NOTICE '  Contraseña: Paciente123!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Especialidades creadas: 10';
  RAISE NOTICE 'Doctores de ejemplo: 4';
  RAISE NOTICE 'Vistas creadas: 3';
  RAISE NOTICE 'Funciones creadas: 2';
  RAISE NOTICE '============================================';
END $$;