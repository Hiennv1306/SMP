import { supabase } from '../../config/supabase'

export async function createTuitionInvoices({
  classId,
  studentIds,
  billingMonth,
}) {
  if (!supabase) {
    return {
      data: null,
      error: { message: 'Supabase chua Duoc cau hinh.' },
    }
  }

  const { data, error } = await supabase.rpc('teacher_create_monthly_invoices', {
    p_class_id: classId,
    p_student_ids: studentIds,
    p_billing_month: billingMonth,
  })

  if (error) {
    return {
      data: null,
      error: {
        ...error,
        message: 'Khong the tao hoa don. Vui long ap dung migration teacher_create_monthly_invoices tren Supabase.',
      },
    }
  }
  if (!data?.ok) {
    return {
      data: null,
      error: { code: data?.code, message: data?.code || 'Khong the tao hoa don.' },
    }
  }

  return { data, error: null }
}
