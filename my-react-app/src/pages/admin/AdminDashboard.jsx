import { Card, Col, Row, Table, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { DashboardCard } from '../../components/common/DashboardCard'
import { StatusTag } from '../../components/common/StatusTag'
import { adminService } from '../../services/supabase/admin.service'

function AdminDashboard() {
  const [dashboard, setDashboard] = useState({
    cards: [],
    revenue: [],
    transactions: [],
    recentEnrollments: [],
  })
  const [loading, setLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { data, error } = await adminService.getDashboard()
    if (error) {
      message.error(error.message || 'Không thể tải dữ liệu tổng quan.')
    } else {
      setDashboard(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  const maxRevenue = Math.max(...(dashboard.revenue || []).map((item) => item.value), 1)
  const icons = [<TeamOutlined />, <UserOutlined />, <BookOutlined />, <TeamOutlined />]

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description="Cập nhật hoạt động trung tâm ngày 19/11/2026"
        breadcrumb={['Admin', 'Tổng quan']}
      />
      <div className="dashboard-grid">
        {(dashboard.cards || []).map((card, index) => (
          <DashboardCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={icons[index]}
            trend={<><ArrowUpOutlined /> {card.trend}</>}
          />
        ))}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Doanh thu 6 thang gan nhat" className="content-card">
            <div className="chart-bars">
              {(dashboard.revenue || []).map((item) => (
                <div className="chart-bar-wrap" key={item.month}>
                  <div
                    className="chart-bar"
                    style={{ height: `${(item.value / maxRevenue) * 82}%` }}
                    title={`${item.value} trieu dong`}
                  />
                  <span className="chart-label">{item.month}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Giao dịch gân đây" className="content-card">
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={dashboard.transactions || []}
              loading={loading}
              columns={[
                { title: 'Hóa đơn', dataIndex: 'id' },
                { title: 'Số tiền', dataIndex: 'amount' },
                { title: 'Trạng thái', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
              ]}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Ghi danh gần đây" className="content-card">
            <Table
              size="middle"
              rowKey="id"
              pagination={false}
              dataSource={dashboard.recentEnrollments || []}
              loading={loading}
              columns={[
                { title: 'Học viên', dataIndex: 'name' },
                { title: 'Lớp học', dataIndex: 'course' },
                { title: 'Ngày ghi danh', dataIndex: 'date' },
                { title: 'Trạng thái', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default AdminDashboard
