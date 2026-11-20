export const adminDashboard = {
  cards: [
    { label: 'Tong giao vien', value: '28', trend: '+3 trong thang nay' },
    { label: 'Tong hoc vien', value: '486', trend: '+18 trong thang nay' },
    { label: 'Lop Dang hoat Dong', value: '34', trend: '92% cong suat' },
    { label: 'Tong phu huynh', value: '392', trend: '+12 trong thang nay' },
  ],
  revenue: [
    { month: 'Th1', value: 168 },
    { month: 'Th2', value: 182 },
    { month: 'Th3', value: 174 },
    { month: 'Th4', value: 205 },
    { month: 'Th5', value: 238 },
    { month: 'Th6', value: 254 },
  ],
  recentEnrollments: [
    { id: 1, name: 'Nguyen Minh Anh', course: 'Tieng Anh Giao Tiep A2', date: '18/11/2026', status: 'approved' },
    { id: 2, name: 'Tran Bao Long', course: 'Toan nang cao Lop 6', date: '18/11/2026', status: 'pending' },
    { id: 3, name: 'Le Gia Han', course: 'Lap trinh Scratch', date: '17/11/2026', status: 'approved' },
  ],
  transactions: [
    { id: 'HD-2401', name: 'Nguyen Minh Anh', amount: '2.400.000 d', status: 'paid', date: '18/11/2026' },
    { id: 'HD-2400', name: 'Pham Duc Khang', amount: '3.200.000 d', status: 'paid', date: '18/11/2026' },
    { id: 'HD-2399', name: 'Do Linh Chi', amount: '1.800.000 d', status: 'unpaid', date: '17/11/2026' },
  ],
}

export const teacherDashboard = {
  cards: [
    { label: 'Lop Dang day', value: '6' },
    { label: 'Tong hoc vien', value: '124' },
    { label: 'Buoi hoc hom nay', value: '3' },
    { label: 'Ty le Diem danh', value: '94%' },
  ],
  upcoming: [
    { time: '08:00 - 09:30', name: 'Tieng Anh Giao Tiep A2', room: 'Phong 201', students: 18 },
    { time: '13:30 - 15:00', name: 'Tieng Anh Thieu nhi', room: 'Phong 105', students: 14 },
    { time: '18:00 - 19:30', name: 'IELTS Foundation', room: 'Phong 304', students: 20 },
  ],
}
