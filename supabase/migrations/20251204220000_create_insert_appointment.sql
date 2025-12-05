CREATE OR REPLACE FUNCTION insert_appointment(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_date DATE,
  p_start TIME,
  p_end TIME,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO appointments (
    doctor_id,
    patient_id,
    appointment_date,
    start_time,
    end_time,
    reason,
    status
  ) VALUES (
    p_doctor_id,
    p_patient_id,
    p_date,
    p_start,
    p_end,
    p_reason,
    'confirmed'
  );
END;
$$;
