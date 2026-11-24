import { Button, Breadcrumb } from 'antd'
import { useAuth } from '../../hooks/useAuth'

export function PageHeader({ title, description, breadcrumb = [], extra }) {
  const { profile, user } = useAuth()
  const accountRole = profile?.role
  const roleName = {
    admin: 'Quan tri vien',
    teacher: 'Giao vien',
    parent: 'Phu huynh',
  }[accountRole]
  const displayedBreadcrumb = breadcrumb.map((item) =>
    ['Admin', 'Giao vien', 'Phu huynh'].includes(item) && roleName
      ? roleName
      : item,
  )

  return (
    <div className="page-header">
      <div>
        {displayedBreadcrumb.length > 0 && (
          <Breadcrumb
            items={displayedBreadcrumb.map((item) => ({ title: item }))}
            style={{ marginBottom: 8 }}
          />
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  )
}

export function ActionButton({ children, ...props }) {
  return <Button type="primary" {...props}>{children}</Button>
}
