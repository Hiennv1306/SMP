import { Empty, Spin, Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

export function EmptyState({ description = 'Chua co du lieu', action }) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={description}
    >
      {action}
    </Empty>
  )
}

export function LoadingState({ tip = 'Dang tai du lieu...' }) {
  return (
    <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
      <Spin tip={tip} />
    </div>
  )
}

export function ConfirmDialog({ open, title, content, onConfirm, onCancel, confirmLoading }) {
  return (
    <Modal
      open={open}
      title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />{title}</span>}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Xac nhan"
      cancelText="Huy"
      confirmLoading={confirmLoading}
    >
      {content}
    </Modal>
  )
}
