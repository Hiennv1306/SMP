import { Tag } from 'antd'

const statusMap = {
  active: { text: 'Dang hoat Dong', color: 'success' },
  inactive: { text: 'Tam dung', color: 'default' },
  pending: { text: 'Cho xu ly', color: 'warning' },
  paid: { text: 'Da thanh toan', color: 'success' },
  unpaid: { text: 'Chua thanh toan', color: 'error' },
  approved: { text: 'Da duyet', color: 'success' },
  present: { text: 'Co mat', color: 'success' },
  absent: { text: 'Nghi khong phep', color: 'error' },
  excused: { text: 'Nghi co phep', color: 'warning' },
  late: { text: 'Di muon', color: 'gold' },
  sent: { text: 'Da gui', color: 'success' },
  draft: { text: 'Ban nhap', color: 'default' },
}

export function StatusTag({ status, text }) {
  const config = statusMap[status] || { text: text || status, color: 'default' }
  return <Tag color={config.color}>{text || config.text}</Tag>
}
