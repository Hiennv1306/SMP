export const roleMenus = {
  admin: [
    { key: '/admin', label: 'Tong quan', icon: 'dashboard' },
    { key: '/admin/teachers', label: 'Quan ly giao vien', icon: 'team' },
    { key: '/admin/classes', label: 'Quan ly lop hoc', icon: 'book' },
    { key: '/admin/students', label: 'Quan ly hoc vien', icon: 'student' },
    { key: '/admin/payments', label: 'Thanh toan', icon: 'wallet' },
    { key: '/admin/notifications', label: 'Thong bao', icon: 'bell' },
  ],
  teacher: [
    { key: '/teacher', label: 'Tong quan', icon: 'dashboard' },
    { key: '/teacher/classes', label: 'Lop cua toi', icon: 'book' },
    { key: '/teacher/schedule', label: 'Lich day', icon: 'calendar' },
    { key: '/teacher/attendance', label: 'Diem danh', icon: 'check' },
    { key: '/teacher/tuition', label: 'Thong bao hoc phi', icon: 'wallet' },
    { key: '/teacher/cancellation', label: 'Xin huy buoi hoc', icon: 'cancel' },
  ],
  parent: [
    { key: '/parent', label: 'Tong quan', icon: 'dashboard' },
    { key: '/parent/children', label: 'Con cua toi', icon: 'student' },
    { key: '/parent/classes', label: 'Tim lop hoc', icon: 'search' },
    { key: '/parent/enrollment', label: 'Ghi danh', icon: 'form' },
    { key: '/parent/payments', label: 'Hoc phi', icon: 'wallet' },
    { key: '/parent/notifications', label: 'Thong bao', icon: 'bell' },
  ],
}
