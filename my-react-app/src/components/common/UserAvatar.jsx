import { Avatar } from 'antd'

export function UserAvatar({ name, src, size = 'default', color }) {
  const fallback = name
    ?.split(' ')
    .filter(Boolean)
    .slice(-1)[0]
    ?.charAt(0)
    ?.toUpperCase() || 'U'

  return (
    <Avatar src={src} size={size} style={{ backgroundColor: src ? undefined : (color || '#1677ff') }}>
      {fallback}
    </Avatar>
  )
}
