import { Card } from 'antd'

export function DashboardCard({ label, value, icon, trend, trendType = 'default' }) {
  return (
    <Card className="dashboard-card">
      <div className="card-stat">
        <div>
          <div className="card-stat-label">{label}</div>
          <div className="card-stat-value">{value}</div>
        </div>
        {icon && <div className="card-stat-icon">{icon}</div>}
      </div>
      {trend && (
        <div
          className="card-stat-trend"
          style={{ color: trendType === 'danger' ? '#ff4d4f' : '#52c41a' }}
        >
          {trend}
        </div>
      )}
    </Card>
  )
}
