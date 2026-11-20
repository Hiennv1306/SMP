import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, Select, Space, message, Switch } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { StatusTag } from '../../components/common/StatusTag'
import { DataTable } from '../../components/common/DataTable'
import { FormModal } from '../../components/common/FormModal'
import { adminService } from '../../services/supabase/admin.service'
import { ConfirmDialog } from '../../components/common/SharedStates'

function normalizeVietnamesePhone(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('84')) return `+${digits}`
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`
  return `+84${digits}`
}

function TeacherManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await adminService.listTeachers()
    if (error) {
      setRows([])
      message.error(error.code === 'UNAUTHORIZED'
        ? 'Phien dang nhap Admin da het han. Vui long dang nhap lai.'
        : (error.message || 'Khong the tai danh sach giao vien.'))
    } else if (data?.length) {
      setRows(data.map((item) => ({
        id: item.id,
        authUserId: item.users?.auth_user_id,
        name: item.users?.full_name || 'Chua co ten',
        email: item.email || '',
        phone: item.users?.phone || '',
        subject: item.specialty || '',
        classes: item.classCount ?? 0,
        status: item.users?.is_active === false ? 'inactive' : 'active',
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTeachers()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadTeachers])

  const filtered = rows.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'all' || teacher.status === status
    return matchesSearch && matchesStatus
  })

  const columns = [
    { title: 'Giao vien', dataIndex: 'name', render: (value) => <strong>{value}</strong> },
    { title: 'Bo mon', dataIndex: 'subject' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'So Dien thoai', dataIndex: 'phone' },
    { title: 'Lop Dang day', dataIndex: 'classes', align: 'center' },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
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
            icon={<DeleteOutlined />}
            onClick={() => setDeleting(record)}
          />
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Quan ly giao vien"
        description="Quan ly thong tin, tai khoan va lop hoc Duoc phan cong"
        breadcrumb={['Admin', 'Giao vien']}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true) }}>Them giao vien</Button>}
      />
      <Card className="content-card">
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim theo ten giao vien..." />
          <Select value={status} onChange={setStatus} style={{ width: 180 }} options={[
            { value: 'all', label: 'Tat ca trang thai' },
            { value: 'active', label: 'Dang hoat Dong' },
            { value: 'inactive', label: 'Tam dung' },
          ]} />
        </div>
        <DataTable columns={columns} dataSource={filtered} loading={loading} />
      </Card>
      <FormModal
        open={open}
        title={editing ? 'Sua giao vien' : 'Them giao vien'}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onSubmit={async (values) => {
          setLoading(true)
          const payload = {
            teacherId: editing?.id,
            authUserId: editing?.authUserId,
            fullName: values.name,
            phone: normalizeVietnamesePhone(values.phone),
            email: values.email,
            specialty: values.subject,
            bio: values.bio,
            isActive: values.isActive,
          }

          const { error } = editing
            ? await adminService.updateTeacher(payload)
            : await adminService.createTeacher({
                ...payload,
                password: values.password,
              })

          setLoading(false)
          if (error) {
            message.error(error.message || 'Khong the luu giao vien.')
            return
          }

          setOpen(false)
          setEditing(null)
          message.success(editing ? 'Da cap nhat giao vien.' : 'Da them giao vien.')
          loadTeachers()
        }}
        submitText={editing ? 'Luu thay Doi' : 'Them moi'}
      >
        <Form.Item name="name" label="Ho va ten" initialValue={editing?.name} rules={[{ required: true }]}>
          <Input placeholder="Nhap ho va ten" />
        </Form.Item>
        <Form.Item name="email" label="Email" initialValue={editing?.email} rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="email@educenter.vn" />
        </Form.Item>
        <Form.Item name="phone" label="So Dien thoai" initialValue={editing?.phone} rules={[{ required: true }]}>
          <Input placeholder="0978..." />
        </Form.Item>
        {!editing && (
          <Form.Item name="password" label="Mat khau tam" rules={[{ required: true, min: 8 }]}>
            <Input.Password placeholder="It nhat 8 ky tu" />
          </Form.Item>
        )}
        <Form.Item name="subject" label="Bo mon" initialValue={editing?.subject} rules={[{ required: true }]}>
          <Select options={[
            { value: 'Tieng Anh', label: 'Tieng Anh' },
            { value: 'Toan', label: 'Toan' },
            { value: 'Lap trinh', label: 'Lap trinh' },
          ]} />
        </Form.Item>
        {editing && (
          <Form.Item
            name="isActive"
            label="Trang thai tai khoan"
            valuePropName="checked"
            initialValue={editing.status !== 'inactive'}
          >
            <Switch checkedChildren="Hoat Dong" unCheckedChildren="Tam dung" />
          </Form.Item>
        )}
      </FormModal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Vo hieu giao vien"
        content={`Xac nhan vo hieu tai khoan "${deleting?.name || ''}"? Lop va ho so hien tai se Duoc giu lai.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          setLoading(true)
          const { error } = await adminService.deleteTeacher({
            teacherId: deleting?.id,
            authUserId: deleting?.authUserId,
          })
          setLoading(false)
          if (error) {
            message.error(error.message || 'Khong the vo hieu giao vien.')
            return
          }
          setDeleting(null)
          message.success('Da vo hieu giao vien.')
          loadTeachers()
        }}
      />
    </>
  )
}

export default TeacherManagement
