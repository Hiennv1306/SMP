import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Select, Space, Progress, TimePicker, message, Tag } from 'antd'
import dayjs from 'dayjs'
import { PlusOutlined, EyeOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { StatusTag } from '../../components/common/StatusTag'
import { DataTable } from '../../components/common/DataTable'
import { FormModal } from '../../components/common/FormModal'
import { ConfirmDialog } from '../../components/common/SharedStates'
import { adminService } from '../../services/supabase/admin.service'

function ClassManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [teachers, setTeachers] = useState([])
  const [editing, setEditing] = useState(null)
  const [closing, setClosing] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)

    const [classResult, teacherResult] = await Promise.all([
      adminService.listClasses(),
      adminService.listTeachers(),
    ])

    if (classResult.error) {
      message.error(classResult.error.message || 'Khong the tai danh sach lop hoc.')
      setRows([])
    } else if (classResult.data?.ok) {
      setRows((classResult.data.data || []).map((item) => ({
        ...item,
        firstDay: item.schedules?.[0]?.dayOfWeek,
        firstStart: item.schedules?.[0]?.startTime,
        secondDay: item.schedules?.[1]?.dayOfWeek,
        secondStart: item.schedules?.[1]?.startTime,
      })))
    }

    if (teacherResult.error) {
      message.error(teacherResult.error.message || 'Khong the tai danh sach giao vien.')
      setTeachers([])
    } else if (teacherResult.data) {
      setTeachers(teacherResult.data.map((item) => ({
        value: item.id,
        label: item.users?.full_name || 'Giao vien',
      })))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const filtered = rows.filter((item) =>
    item.className.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'all' || item.status === status),
  )

  const columns = [
    { title: 'Ten lop', dataIndex: 'className', render: (value) => <strong>{value}</strong> },
    { title: 'Giao vien', dataIndex: 'teacherName' },
    {
      title: 'Do tuoi',
      key: 'age',
      render: (_, record) => `${record.minAge}-${record.maxAge} tuoi`,
    },
    {
      title: 'Si so',
      dataIndex: 'enrolled',
      render: (_, record) => (
        <div style={{ minWidth: 120 }}>
          <strong>{record.enrolled}/{record.maxStudents}</strong>
          <Progress
            percent={Math.round(record.enrolled / record.maxStudents * 100)}
            size="small"
            showInfo={false}
          />
        </div>
      ),
    },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value === 'open' ? 'active' : value} /> },
    {
      title: 'Thao tac',
      key: 'action',
      width: 170,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record)
              setOpen(true)
            }}
          />
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            disabled={record.status === 'closed'}
            onClick={() => setClosing(record)}
          />
        </Space>
      ),
    },
  ]

  async function handleSubmit(values) {
    const firstDay = Number(values.firstDay)
    const secondDay = Number(values.secondDay)
    if (firstDay === secondDay) {
      message.error('Hai buoi hoc phai vao hai ngay khac nhau.')
      return
    }

    if (!values.firstStart || !values.secondStart) {
      message.error('Vui long chon gio bat Dau cho hai buoi.')
      return
    }

    const firstStart = values.firstStart.format('HH:mm')
    const secondStart = values.secondStart.format('HH:mm')
    setLoading(true)
    const payload = {
      classId: editing?.id,
      className: values.className,
      teacherId: values.teacherId,
      maxStudents: Number(values.maxStudents),
      minAge: Number(values.minAge),
      maxAge: Number(values.maxAge),
      firstDay,
      firstStart,
      secondDay,
      secondStart,
    }

    const { data, error } = editing
      ? await adminService.updateClass(payload)
      : await adminService.createClass(payload)

    setLoading(false)

    if (error) {
      message.error(error.message || 'Khong the luu lop hoc.')
      return
    }
    if (!data?.ok) {
      message.error(data?.code || 'Khong the luu lop hoc.')
      return
    }

    setOpen(false)
    setEditing(null)
    message.success(editing ? 'Da cap nhat lop hoc.' : 'Da tao lop hoc.')
    loadData()
  }

  return (
    <>
      <PageHeader
        title="Quan ly lop hoc"
        description="Tao lop voi thong tin suc chua, giao vien va Do tuoi hoc vien"
        breadcrumb={['Admin', 'Lop hoc']}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true) }}>Tao lop hoc</Button>}
      />
      <Card className="content-card">
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim theo ten lop..." />
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 180 }}
            options={[
              { value: 'all', label: 'Tat ca lop' },
              { value: 'open', label: 'Dang mo' },
              { value: 'closed', label: 'Da dong' },
              { value: 'cancelled', label: 'Da huy' },
            ]}
          />
        </div>
        <DataTable columns={columns} dataSource={filtered} loading={loading} scrollX={1000} />
      </Card>

      <FormModal
        open={open}
        title={editing ? 'Sua lop hoc' : 'Tao lop hoc'}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        submitText={editing ? 'Luu thay Doi' : 'Tao lop'}
        confirmLoading={loading}
      >
        <Form.Item name="className" label="Ten lop hoc" initialValue={editing?.className} rules={[{ required: true }]}>
          <Input placeholder="Vi du: English Kids 01" />
        </Form.Item>
        <Form.Item name="teacherId" label="Giao vien" initialValue={editing?.teacherId} rules={[{ required: true }]}>
          <Select options={teachers} placeholder="Chon giao vien" />
        </Form.Item>
        <Form.Item name="maxStudents" label="So luong hoc sinh toi Da" initialValue={editing?.maxStudents} rules={[{ required: true }]}>
          <InputNumber min={1} max={200} style={{ width: '100%' }} placeholder="Vi du: 15" />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="minAge" label="Do tuoi toi thieu" initialValue={editing?.minAge} rules={[{ required: true }]}>
            <InputNumber min={1} max={99} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxAge" label="Do tuoi toi Da" initialValue={editing?.maxAge} rules={[{ required: true }]}>
            <InputNumber min={1} max={99} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card size="small" title="Buoi hoc thu nhat">
            <Form.Item name="firstDay" label="Ngay trong tuan" initialValue={editing?.firstDay || 1} rules={[{ required: true }]}>
              <Select options={[
                { value: 1, label: 'Thu Hai' },
                { value: 2, label: 'Thu Ba' },
                { value: 3, label: 'Thu Tu' },
                { value: 4, label: 'Thu Nam' },
                { value: 5, label: 'Thu Sau' },
                { value: 6, label: 'Thu Bay' },
                { value: 7, label: 'Chu Nhat' },
              ]} />
            </Form.Item>
            <Form.Item name="firstStart" label="Gio bat Dau" initialValue={editing?.firstStart ? dayjs(editing.firstStart, 'HH:mm') : dayjs('18:00', 'HH:mm')} rules={[{ required: true }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>
          </Card>
          <Card size="small" title="Buoi hoc thu hai">
            <Form.Item name="secondDay" label="Ngay trong tuan" initialValue={editing?.secondDay || 4} rules={[{ required: true }]}>
              <Select options={[
                { value: 1, label: 'Thu Hai' },
                { value: 2, label: 'Thu Ba' },
                { value: 3, label: 'Thu Tu' },
                { value: 4, label: 'Thu Nam' },
                { value: 5, label: 'Thu Sau' },
                { value: 6, label: 'Thu Bay' },
                { value: 7, label: 'Chu Nhat' },
              ]} />
            </Form.Item>
            <Form.Item name="secondStart" label="Gio bat Dau" initialValue={editing?.secondStart ? dayjs(editing.secondStart, 'HH:mm') : dayjs('18:00', 'HH:mm')} rules={[{ required: true }]}>
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>
          </Card>
        </div>
        <Tag color="blue">Moi buoi hoc tu Dong keo dai 105 phut (1 gio 45 phut)</Tag>
      </FormModal>

      <ConfirmDialog
        open={Boolean(closing)}
        title="Dong lop hoc"
        content={`Xac nhan dong lop "${closing?.className || ''}"? Hoc vien Da ghi danh se Duoc giu lai.`}
        onCancel={() => setClosing(null)}
        onConfirm={async () => {
          setLoading(true)
          const { data, error } = await adminService.deleteClass(closing?.id)
          setLoading(false)
          if (error || !data?.ok) {
            message.error(error?.message || data?.code || 'Khong the dong lop.')
            return
          }
          setClosing(null)
          message.success('Da dong lop hoc.')
          loadData()
        }}
      />
    </>
  )
}

export default ClassManagement
