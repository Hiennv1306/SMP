import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Row, List, Progress, message } from 'antd'
import { TeamOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { DashboardCard } from '../../components/common/DashboardCard'
import { teacherService } from '../../services/supabase/teacher.service'

function TeacherDashboard() {
  const icons = [<TeamOutlined />, <UserOutlined />, <CalendarOutlined />, <CheckCircleOutlined />]
  const [dashboard, setDashboard] = useState({
    cards: [],
    todaySessions: [],
    attendanceRate: 0,
  })
  const [loading, setLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { data, error } = await teacherService.getDashboardSummary()
    if (error) {
      message.error(error.message || 'Khong the tai tong quan giao vien.')
    } else if (data) {
      setDashboard(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  return (
    <>
      <PageHeader title="Tong quan giao vien" description="Chao co Chau, day la lich lam viec hom nay" breadcrumb={['Giao vien', 'Tong quan']} />
      <div className="dashboard-grid">
        {(dashboard.cards || []).map((card, index) => (
          <DashboardCard key={card.label} label={card.label} value={card.value} icon={icons[index]} />
        ))}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Lich hoc hom nay" className="content-card">
            <List
              dataSource={dashboard.todaySessions || []}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<strong>{item.name}</strong>}
                    description={`${item.time} • ${item.room}`}
                  />
                  <span>{item.students} hoc vien</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Ty le Diem danh thang" className="content-card">
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Progress type="dashboard" percent={dashboard.attendanceRate || 0} />
              <div style={{ color: '#52c41a', marginTop: 8 }}>Ty le diem danh trong cac buoi da ket thuc</div>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default TeacherDashboard
