import { useEffect, useState } from 'react'
import { Button, message } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import {
  enablePushNotifications,
  getPushPermissionStatus,
} from '../../services/push.service'

export function NotificationPermissionButton() {
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPushPermissionStatus().then(setPermission)
  }, [])

  async function handleEnable() {
    setLoading(true)
    const result = await enablePushNotifications()
    setLoading(false)

    if (!result.ok) {
      message.error(result.message)
      return
    }

    setPermission(Notification.permission)
    message.success('Da bat thong bao tren thiet bi.')
  }

  if (permission === 'unsupported') return null

  return (
    <Button
      shape="circle"
      icon={<BellOutlined />}
      loading={loading}
      title={permission === 'granted' ? 'Thong bao da bat' : 'Bat thong bao'}
      onClick={handleEnable}
    />
  )
}
