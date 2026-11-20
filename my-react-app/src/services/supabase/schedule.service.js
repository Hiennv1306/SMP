import { supabase } from '../../config/supabase'
import { toSupabaseError } from '../../utils/errorHandler'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase chua Duoc cau hinh.')
  return supabase
}

export const scheduleService = {
  async saveSchedules(classId, schedules) {
    if (schedules.length > 2) {
      return { data: null, error: { message: 'Moi lop chi Duoc toi Da hai buoi moi tuan.' } }
    }

    const days = schedules.map((item) => item.day_of_week)
    if (new Set(days).size !== days.length) {
      return { data: null, error: { message: 'Hai buoi hoc phai vao hai ngay khac nhau.' } }
    }

    for (const schedule of schedules) {
      const [startHour, startMinute] = schedule.start_time.split(':').map(Number)
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number)
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
      if (duration !== 90) {
        return { data: null, error: { message: 'Moi buoi hoc phai keo dai Dung 90 phut.' } }
      }
    }

    await requireSupabase()
      .from('class_schedules')
      .delete()
      .eq('class_id', classId)

    const rows = schedules.map((item) => ({ ...item, class_id: classId }))
    const { data, error } = await requireSupabase()
      .from('class_schedules')
      .insert(rows)
      .select()

    return error
      ? { data: null, error: toSupabaseError(error) }
      : { data, error: null }
  },
}
