import { Button, Breadcrumb } from 'antd'

export function PageHeader({ title, description, breadcrumb = [], extra }) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb.length > 0 && (
          <Breadcrumb
            items={breadcrumb.map((item) => ({ title: item }))}
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
