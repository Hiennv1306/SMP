import { supabase } from '../../config/supabase'

export async function enrollStudent(studentId, classId) {
  if (!supabase) {
    return {
      data: null,
      error: { message: 'Supabase chua Duoc cau hinh.' },
    }
  }

  const { data, error } = await supabase.rpc('enroll_student', {
    p_student_id: studentId,
    p_class_id: classId,
  })

  return { data, error }
}
