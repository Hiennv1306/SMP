import { supabase } from '../../config/supabase'

export async function createTuitionNotifications({
  classId,
  studentIds,
  billingMonth,
  amount,
}) {
  if (!supabase) {
    return {
      data: null,
      error: { message: 'Supabase chua Duoc cau hinh.' },
    }
  }

  const { data, error } = await supabase.rpc('create_tuition_notifications', {
    p_class_id: classId,
    p_student_ids: studentIds,
    p_billing_month: billingMonth,
    p_amount: amount,
  })

  return { data, error }
}
