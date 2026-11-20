import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Select } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { StatusTag } from '../../components/common/StatusTag'
import { DataTable } from '../../components/common/DataTable'
import { adminService } from '../../services/supabase/admin.service'
import { message } from 'antd'

function StudentManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await adminService.listStudents()

    if (error) {
      setStudents([])
      message.error(error.message || 'Khong the tai danh sach hoc vien.')
    } else {
      setStudents((data || []).map((item) => {
        const activeEnrollment = (item.enrollments || []).find((enrollment) => enrollment.status === 'active')
        return {
          id: item.id,
          code: `HV${String(item.id).padStart(4, '0')}`,
          name: item.full_name,
          age: item.age,
          gradeLevel: item.grade_level,
          parent: item.users?.full_name || 'Chua ro',
          phone: item.users?.phone || '',
          className: activeEnrollment?.classes?.class_name || 'Chua ghi danh',
          status: item.status === 'active' ? 'active' : 'pending',
        }
      }))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadStudents, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadStudents])

  const filtered = students.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'all' || item.status === status),
  )

  const columns = [
    { title: 'Ma HV', dataIndex: 'code', width: 100 },
    { title: 'Ho va ten', dataIndex: 'name', render: (value) => <strong>{value}</strong> },
    { title: 'Do tuoi', dataIndex: 'age', align: 'center' },
    { title: 'Khoi/lop', dataIndex: 'gradeLevel' },
    { title: 'Phu huynh', dataIndex: 'parent' },
    { title: 'So Dien thoai', dataIndex: 'phone' },
    { title: 'Lop Dang hoc', dataIndex: 'className' },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
    { title: '', key: 'action', width: 80, render: () => <Button size="small" icon={<EyeOutlined />} /> },
  ]

  return (
    <>
      <PageHeader
        title="Quan ly hoc vien"
        description="Ho so hoc vien, thong tin phu huynh va lich su ghi danh"
        breadcrumb={['Admin', 'Hoc vien']}
        extra={<Button type="primary" disabled>Hoc vien tu dang ky qua phu huynh</Button>}
      />
      <Card className="content-card">
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim theo ten hoc vien..." />
          <Select value={status} onChange={setStatus} style={{ width: 180 }} options={[
            { value: 'all', label: 'Tat ca trang thai' },
            { value: 'active', label: 'Dang hoc' },
            { value: 'pending', label: 'Cho ghi danh' },
          ]} />
        </div>
        <DataTable columns={columns} dataSource={filtered} loading={loading} scrollX={1200} />
      </Card>
    </>
  )
}

export default StudentManagement
