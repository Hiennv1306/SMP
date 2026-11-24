import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Row, List, Badge, Empty, message } from 'antd'
import { UserOutlined, BookOutlined, CalendarOutlined, WalletOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { DashboardCard } from '../../components/common/DashboardCard'
import { StatusTag } from '../../components/common/StatusTag'
import { parentService } from '../../services/supabase/parent.service'
import { useAuth } from '../../hooks/useAuth'

const dayNames = {
  1: 'Thu Hai',
  2: 'Thu Ba',
  3: 'Thu Tu',
  4: 'Thu Nam',
  5: 'Thu Sau',
  6: 'Thu Bay',
  7: 'Chu Nhat',
}

function ParentDashboard() {
  const { profile, user } = useAuth()
  const [dashboard, setDashboard] = useState({
    cards: [],
    children: [],
    schedules: [],
  })
  const [loading, setLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { data, error } = await parentService.getDashboardSummary()
    if (error) {
      message.error(error.message || 'Khong the tai tong quan phu huynh.')
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
      <PageHeader
        title={`Xin chao, ${profile?.full_name || user?.user_metadata?.full_name || 'phu huynh'}!`}
        description="Tong hop hoat dong hoc tap cua cac con"
        breadcrumb={['Phu huynh', 'Tong quan']}
      />
      <div className="dashboard-grid">
        {(dashboard.cards || []).map((card, index) => (
          <DashboardCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={[<UserOutlined />, <BookOutlined />, <CalendarOutlined />, <WalletOutlined />][index]}
          />
        ))}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Con cua toi" className="content-card">
            <List
              loading={loading}
              dataSource={dashboard.children || []}
              renderItem={(item) => (
                <List.Item actions={[<StatusTag key="status" status={item.status} />]}>
                  <List.Item.Meta
                    avatar={<div className="brand-mark" style={{ width: 40, height: 40 }}>N</div>}
                    title={<strong>{item.fullName}</strong>}
                    description={item.detail}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Lịch học của các con" className="content-card" loading={loading}>
            {(dashboard.schedules || []).length ? (
              (dashboard.schedules || []).map((item) => (
                <div key={`${item.childId}-${item.classId}-${item.dayOfWeek}`} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Badge dot>
                    <strong>Tên con: {item.childName}</strong>
                  </Badge>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{item.className}</div>
                  <div style={{ color: '#8c96a8', fontSize: 12, marginTop: 4 }}>
                    Thời gian: {dayNames[item.dayOfWeek]} • {item.startTime} - {item.endTime}
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Chưa có lịch" />
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default ParentDashboard
