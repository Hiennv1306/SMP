import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, Empty, List, message } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { parentService } from '../../services/supabase/parent.service'

function ParentNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    const { data, error } = await parentService.listNotifications()
    setLoading(false)
    if (error) {
      message.error(error.message || 'Khong the tai thong bao.')
      setNotifications([])
      return
    }
    setNotifications(data || [])
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadNotifications, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadNotifications])

  async function openInvoice(item) {
    if (!item.payment_id) return

    if (!item.is_read) {
      const { error } = await parentService.markNotificationRead(item.id)
      if (error) {
        message.error(error.message || 'Khong the cap nhat trang thai thong bao.')
        return
      }
    }
    navigate(`/parent/payments?paymentId=${item.payment_id}`)
  }

  return (
    <>
      <PageHeader title="Thong bao" description="Cap nhat lich hoc, hoc phi va thong tin trung tam" breadcrumb={['Phu huynh', 'Thong bao']} />
      <Card className="content-card">
        <List
          loading={loading}
          locale={{ emptyText: <Empty description="Chua co thong bao" /> }}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Badge dot={!item.is_read}>
                    <strong>{item.title}</strong>
                  </Badge>
                }
                description={item.message}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#8c96a8', whiteSpace: 'nowrap' }}>
                  {item.created_at ? dayjs(item.created_at).format('DD/MM/YYYY HH:mm') : ''}
                </span>
                {item.payment_id && (
                  <Button type="link" onClick={() => openInvoice(item)}>
                    Xem hoa don va QR
                  </Button>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </>
  )
}

export default ParentNotifications
