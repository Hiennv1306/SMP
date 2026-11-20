import { Button, Card, Col, Row, Table, Tag, Alert } from 'antd'
import { QrcodeOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { payments } from '../../mocks/payments.mock'

function TuitionPayments() {
  return (
    <>
      <PageHeader title="Hoc phi" description="Hoa Don, lich su thanh toan va VietQR (giao dien minh hoa)" breadcrumb={['Phu huynh', 'Hoc phi']} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="content-card" title="Hoa Don thang 11/2026">
            <Table
              size="middle"
              rowKey="id"
              pagination={false}
              dataSource={payments.slice(0, 2)}
              columns={[
                { title: 'Hoa Don', dataIndex: 'id' },
                { title: 'Ky', dataIndex: 'month' },
                { title: 'So tien', dataIndex: 'amount', render: (value) => `${value.toLocaleString('vi-VN')} d` },
                { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusTag status={value} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="content-card" title="Thanh toan VietQR">
            <div style={{ textAlign: 'center', background: '#f7fbff', border: '1px dashed #91caff', borderRadius: 12, padding: 18 }}>
              <QrcodeOutlined style={{ fontSize: 92, color: '#172b4d' }} />
              <div style={{ marginTop: 10, fontWeight: 700 }}>1.800.000 d</div>
              <Tag color="blue" style={{ marginTop: 8 }}>Ma GD: EDU241119</Tag>
            </div>
            <Alert style={{ marginTop: 12 }} type="warning" showIcon message="UI minh hoa, chua ket noi cong thanh toan." />
            <Button type="primary" block style={{ marginTop: 12 }}>Mo ung dung ngan hang</Button>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default TuitionPayments
