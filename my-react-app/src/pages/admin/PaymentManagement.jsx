import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Row, Select, Space, Statistic, message } from 'antd'
import { SearchInput } from '../../components/common/SearchInput'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { DataTable } from '../../components/common/DataTable'
import { adminService } from '../../services/supabase/admin.service'

function PaymentManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [classId, setClassId] = useState('all')
  const [payments, setPayments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [enrollmentResult, classResult] = await Promise.all([
      adminService.listPaymentEnrollments(),
      adminService.listClasses(),
    ])

    if (enrollmentResult.error) {
      message.error(enrollmentResult.error.message || 'Khong the tai danh sach thanh toan.')
      setPayments([])
    } else {
      const rows = []
      ;(enrollmentResult.data || []).forEach((enrollment) => {
        const student = enrollment.students
        const classInfo = enrollment.classes
        const enrollmentPayments = [...(enrollment.payments || [])]
          .sort((a, b) => String(b.billing_month || '').localeCompare(String(a.billing_month || '')))

        if (!enrollmentPayments.length) {
          rows.push({
            id: `enrollment-${enrollment.id}`,
            code: '--',
            student: student?.full_name || 'Chua ro',
            parent: student?.users?.full_name || 'Chua ro',
            classId: classInfo?.id,
            className: classInfo?.class_name || 'Chua ro lop',
            billingMonth: '--',
            amount: 0,
            status: 'no_invoice',
            enrollmentStatus: enrollment.status,
          })
          return
        }

        enrollmentPayments.forEach((payment) => {
          rows.push({
            id: payment.id,
            code: `HD-${String(payment.id).padStart(4, '0')}`,
            student: student?.full_name || 'Chua ro',
            parent: student?.users?.full_name || 'Chua ro',
            classId: classInfo?.id,
            className: classInfo?.class_name || 'Chua ro lop',
            billingMonth: payment.billing_month || '--',
            amount: Number(payment.amount || 0),
            status: payment.status,
            paidAt: payment.paid_at,
            refundedAt: payment.refunded_at,
            enrollmentStatus: enrollment.status,
          })
        })
      })
      setPayments(rows)
    }

    if (classResult.error) {
      message.error(classResult.error.message || 'Khong the tai danh sach lop hoc.')
      setClasses([])
    } else if (classResult.data?.ok) {
      setClasses(classResult.data.data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const filtered = useMemo(() => payments.filter((item) =>
    item.student.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'all' || item.status === status) &&
    (classId === 'all' || String(item.classId) === String(classId)),
  ), [payments, search, status, classId])

  const paidAmount = filtered
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0)
  const unpaidAmount = filtered
    .filter((item) => item.status === 'unpaid')
    .reduce((sum, item) => sum + item.amount, 0)
  const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0)

  const columns = [
    { title: 'Ma hoa don', dataIndex: 'code', width: 110 },
    { title: 'Lop hoc', dataIndex: 'className' },
    { title: 'Hoc vien', dataIndex: 'student', render: (value) => <strong>{value}</strong> },
    { title: 'Phu huynh', dataIndex: 'parent' },
    { title: 'Ky thanh toan', dataIndex: 'billingMonth' },
    { title: 'So tien', dataIndex: 'amount', render: (value) => `${value.toLocaleString('vi-VN')} đ` },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
    {
      title: 'Thao tac',
      key: 'actions',
      width: 210,
      render: (_, record) => {
        if (!Number.isInteger(Number(record.id)) || record.status === 'no_invoice') {
          return null
        }

        return (
          <Space>
            <Button
              size="small"
              onClick={() => sendNotification(record)}
              disabled={record.status === 'paid'}
            >
              Gui thong bao
            </Button>
            {record.status !== 'paid' && record.status !== 'refunded' && (
              <Button
                size="small"
                type="primary"
                onClick={() => confirmPayment(record)}
              >
                Da thu tien
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  async function sendNotification(record) {
    setLoading(true)
    const { data, error } = await adminService.sendPaymentNotifications([Number(record.id)])
    setLoading(false)

    if (error) {
      message.error(error.message || 'Khong the gui thong bao.')
      return
    }
    if (!data?.ok) {
      message.error(data?.code || 'Khong the gui thong bao.')
      return
    }
    message.success(`Da gui thong bao hoc phi cho phu huynh cua ${record.student}.`)
  }

  async function confirmPayment(record) {
    setLoading(true)
    const { data, error } = await adminService.confirmPayment(Number(record.id))
    setLoading(false)

    if (error) {
      message.error(error.message || 'Khong the xac nhan thu tien.')
      return
    }
    if (!data?.ok) {
      message.error(data?.code || 'Khong the xac nhan thu tien.')
      return
    }

    message.success(`Da xac nhan thu tien hoa don ${record.code}.`)
    loadData()
  }

  return (
    <>
      <PageHeader
        title="Quan ly thanh toan"
        description="Kiem tra hoa don do giao vien tao, gui thong bao phu huynh va xac nhan thu tien"
        breadcrumb={['Admin', 'Thanh toan']}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card><Statistic title="Tong cong no" value={totalAmount} suffix="đ" /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Da thu" value={paidAmount} suffix="đ" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Con phai thu" value={unpaidAmount} suffix="đ" valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <Card className="content-card">
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim theo hoc vien..." />
          <Select
            value={classId}
            onChange={setClassId}
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'Tat ca lop hoc' },
              ...classes.map((item) => ({ value: item.id, label: item.className })),
            ]}
          />
          <Select value={status} onChange={setStatus} style={{ width: 180 }} options={[
            { value: 'all', label: 'Tat ca trang thai' },
            { value: 'paid', label: 'Da thanh toan' },
            { value: 'unpaid', label: 'Chua thanh toan' },
            { value: 'refunded', label: 'Da hoan tien' },
            { value: 'no_invoice', label: 'Chua tao hoa don' },
          ]} />
        </div>
        <DataTable columns={columns} dataSource={filtered} loading={loading} scrollX={1100} />
      </Card>
    </>
  )
}

export default PaymentManagement
