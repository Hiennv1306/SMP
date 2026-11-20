import { useState } from 'react'
import { Card, Col, Row, Select, Statistic } from 'antd'
import { SearchInput } from '../../components/common/SearchInput'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { DataTable } from '../../components/common/DataTable'
import { payments } from '../../mocks/payments.mock'

function PaymentManagement() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const filtered = payments.filter((item) =>
    item.student.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'all' || item.status === status),
  )

  const columns = [
    { title: 'Ma hoa Don', dataIndex: 'id' },
    { title: 'Hoc vien', dataIndex: 'student', render: (value) => <strong>{value}</strong> },
    { title: 'Phu huynh', dataIndex: 'parent' },
    { title: 'Ky thanh toan', dataIndex: 'month' },
    { title: 'So tien', dataIndex: 'amount', render: (value) => `${value.toLocaleString('vi-VN')} d` },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
  ]

  return (
    <>
      <PageHeader title="Quan ly thanh toan" description="Hoa Don, cong no va lich su giao dich" breadcrumb={['Admin', 'Thanh toan']} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card><Statistic title="Doanh thu thang" value="254.000.000" suffix="d" /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Da thu" value="218.000.000" suffix="d" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Con phai thu" value="36.000.000" suffix="d" valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <Card className="content-card">
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim theo hoc vien..." />
          <Select value={status} onChange={setStatus} style={{ width: 180 }} options={[
            { value: 'all', label: 'Tat ca trang thai' },
            { value: 'paid', label: 'Da thanh toan' },
            { value: 'unpaid', label: 'Chua thanh toan' },
          ]} />
        </div>
        <DataTable columns={columns} dataSource={filtered} />
      </Card>
    </>
  )
}

export default PaymentManagement
