import { Badge, Button, Card, List } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { notifications } from '../../mocks/notifications.mock'

function ParentNotifications() {
  return (
    <>
      <PageHeader title="Thong bao" description="Cap nhat lich hoc, hoc phi va thong tin trung tam" breadcrumb={['Phu huynh', 'Thong bao']} extra={<Button>Danh dau Da Doc tat ca</Button>} />
      <Card className="content-card">
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Badge dot={item.unread}>
                    <strong>{item.title}</strong>
                  </Badge>
                }
                description={item.content}
              />
              <span style={{ color: '#8c96a8', whiteSpace: 'nowrap' }}>{item.time}</span>
            </List.Item>
          )}
        />
      </Card>
    </>
  )
}

export default ParentNotifications
