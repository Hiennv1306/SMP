import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import NotFound from '../pages/NotFound'
import SupabaseStatus from '../pages/SupabaseStatus'

import AdminDashboard from '../pages/admin/AdminDashboard'
import TeacherManagement from '../pages/admin/TeacherManagement'
import ClassManagement from '../pages/admin/ClassManagement'
import StudentManagement from '../pages/admin/StudentManagement'
import PaymentManagement from '../pages/admin/PaymentManagement'
import NotificationManagement from '../pages/admin/NotificationManagement'

import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import MyClasses from '../pages/teacher/MyClasses'
import Schedule from '../pages/teacher/Schedule'
import Attendance from '../pages/teacher/Attendance'
import ClassCancellation from '../pages/teacher/ClassCancellation'
import TuitionNotifications from '../pages/teacher/TuitionNotifications'

import ParentDashboard from '../pages/parent/ParentDashboard'
import ChildrenManagement from '../pages/parent/ChildrenManagement'
import ClassDiscovery from '../pages/parent/ClassDiscovery'
import Enrollment from '../pages/parent/Enrollment'
import TuitionPayments from '../pages/parent/TuitionPayments'
import ParentNotifications from '../pages/parent/ParentNotifications'
import Login from '../pages/auth/Login'
import ParentAuth from '../pages/auth/ParentAuth'
import TeacherLogin from '../pages/auth/TeacherLogin'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/parent/login" element={<ParentAuth />} />
      <Route path="/parent/register" element={<ParentAuth />} />

      <Route element={<AppLayout role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/teachers" element={<TeacherManagement />} />
        <Route path="/admin/classes" element={<ClassManagement />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/payments" element={<PaymentManagement />} />
        <Route path="/admin/notifications" element={<NotificationManagement />} />
        <Route path="/admin/supabase-status" element={<SupabaseStatus />} />
      </Route>

      <Route element={<AppLayout role="teacher" />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<MyClasses />} />
        <Route path="/teacher/schedule" element={<Schedule />} />
        <Route path="/teacher/attendance" element={<Attendance />} />
        <Route path="/teacher/tuition" element={<TuitionNotifications />} />
        <Route path="/teacher/cancellation" element={<ClassCancellation />} />
      </Route>

      <Route element={<AppLayout role="parent" />}>
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/parent/children" element={<ChildrenManagement />} />
        <Route path="/parent/classes" element={<ClassDiscovery />} />
        <Route path="/parent/enrollment" element={<Enrollment />} />
        <Route path="/parent/payments" element={<TuitionPayments />} />
        <Route path="/parent/notifications" element={<ParentNotifications />} />
      </Route>

      <Route path="/supabase-status" element={<Navigate to="/admin/supabase-status" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRouter
