import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Card, Col, Empty, QRCode, Row, Table, message } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { parentService } from '../../services/supabase/parent.service'

function TuitionPayments() {
  const [searchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await parentService.listPayments()
    setLoading(false)
    if (error) {
      message.error(error.message || 'Khong the tai hoa don hoc phi.')
      setPayments([])
      return
    }

    const rows = (data || []).map((item) => ({
      id: item.id,
      code: `HD-${String(item.id).padStart(4, '0')}`,
      month: item.billing_month,
      amount: Number(item.amount || 0),
      status: item.status,
      student: item.enrollments?.students?.full_name || '',
      className: item.enrollments?.classes?.class_name || '',
    }))
    setPayments(rows)
    const requestedId = Number(searchParams.get('paymentId'))
    const requestedPayment = rows.find((item) => item.id === requestedId)
    setSelectedId(requestedPayment?.id || rows.find((item) => item.status === 'unpaid')?.id || rows[0]?.id || null)
  }, [searchParams])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadPayments, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadPayments])

  const selectedPayment = useMemo(
    () => payments.find((item) => item.id === selectedId),
    [payments, selectedId],
  )

  const invoiceUrl = selectedPayment
    ? `${window.location.origin}/parent/payments?paymentId=${selectedPayment.id}`
    : ''

  return (
    <>
      <PageHeader title="Hoc phi" description="Hoa don, thong bao thu phi va ma QR hoa don" breadcrumb={['Phu huynh', 'Hoc phi']} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="content-card" title="Danh sach hoa don">
            <Table
              size="middle"
              rowKey="id"
              loading={loading}
              locale={{ emptyText: <Empty description="Chua co hoa don hoc phi" /> }}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              dataSource={payments}
              onRow={(record) => ({ onClick: () => setSelectedId(record.id) })}
              rowClassName={(record) => record.id === selectedId ? 'ant-table-row-selected' : ''}
              columns={[
                { title: 'Hoa Don', dataIndex: 'code' },
                { title: 'Hoc sinh', dataIndex: 'student' },
                { title: 'Lop hoc', dataIndex: 'className' },
                { title: 'Ky', dataIndex: 'month' },
                { title: 'So tien', dataIndex: 'amount', render: (value) => `${value.toLocaleString('vi-VN')} đ` },
                { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="content-card" title="Ma QR hoa don">
            {selectedPayment ? (
              <>
                <div style={{ textAlign: 'center' }}>
                  <QRCode value={invoiceUrl} size={220} />
                  <div><strong>{selectedPayment.code}</strong></div>
                  <div>{selectedPayment.month} · {selectedPayment.amount.toLocaleString('vi-VN')} đ</div>
                  <div>{selectedPayment.student} · {selectedPayment.className}</div>
                </div>
                <Alert
                  style={{ marginTop: 12 }}
                  type="info"
                  showIcon
                  message="Ma QR nay mo dung hoa don trong ung dung. Ma QR chuyen khoan ngan hang can thong tin tai khoan nhan."
                />
              </>
            ) : (
              <Empty description="Chon hoa don de xem ma QR" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default TuitionPayments
