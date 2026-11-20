import { Card, Col, Row, List, Badge } from 'antd'
import { UserOutlined, BookOutlined, CalendarOutlined, WalletOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { DashboardCard } from '../../components/common/DashboardCard'
import { StatusTag } from '../../components/common/StatusTag'
import { notifications } from '../../mocks/notifications.mock'

function ParentDashboard() {
  return (
    <>
      <PageHeader title="Xin chao, chi Ha!" description="Tong hop hoat Dong hoc tap cua cac con" breadcrumb={['Phu huynh', 'Tong quan']} />
      <div className="dashboard-grid">
        <DashboardCard label="Con Dang hoc" value="2" icon={<UserOutlined />} />
        <DashboardCard label="Lop Dang hoat Dong" value="4" icon={<BookOutlined />} />
        <DashboardCard label="Buoi sap toi" value="3" icon={<CalendarOutlined />} />
        <DashboardCard label="Hoc phi chua thanh toan" value="1" icon={<WalletOutlined />} trend="Thanh toan: 1.800.000 d" trendType="danger" />
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Con cua toi" className="content-card">
            <List
              dataSource={[
                { name: 'Nguyen Minh Anh', detail: 'Lop 7 a€¢ Tieng Anh A2', status: 'active' },
                { name: 'Nguyen Gia Bao', detail: 'Lop 3 a€¢ Lap trinh Scratch', status: 'active' },
              ]}
              renderItem={(item) => (
                <List.Item actions={[<StatusTag key="status" status={item.status} />]}>
                  <List.Item.Meta
                    avatar={<div className="brand-mark" style={{ width: 40, height: 40 }}>N</div>}
                    title={<strong>{item.name}</strong>}
                    description={item.detail}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Thong bao moi" className="content-card">
            {notifications.slice(0, 3).map((item) => (
              <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Badge dot={item.unread}>
                  <strong>{item.title}</strong>
                </Badge>
                <div style={{ color: '#8c96a8', fontSize: 12, marginTop: 4 }}>{item.time}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ParentDashboard
