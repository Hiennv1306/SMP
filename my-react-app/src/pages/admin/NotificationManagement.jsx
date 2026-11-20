import { useState } from 'react'
import { Button, Card, Form, Input, Select, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { FormModal } from '../../components/common/FormModal'
import { notifications } from '../../mocks/notifications.mock'

function NotificationManagement() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Quan ly thong bao"
        description="Gui thong bao va theo doi lich su phat hanh"
        breadcrumb={['Admin', 'Thong bao']}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Tao thong bao</Button>}
      />
      <Card className="content-card">
        <Table
          rowKey="id"
          dataSource={notifications}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'Tieu De', dataIndex: 'title', render: (value) => <strong>{value}</strong> },
            { title: 'Noi dung', dataIndex: 'content' },
            { title: 'Thoi gian', dataIndex: 'time', width: 140 },
            { title: 'Trang thai', dataIndex: 'status', width: 130, render: (value) => <StatusTag status={value} /> },
          ]}
        />
      </Card>
      <FormModal open={open} title="Tao thong bao moi" onCancel={() => setOpen(false)} onSubmit={() => setOpen(false)} submitText="Gui thong bao">
        <Form.Item name="title" label="Tieu De" rules={[{ required: true }]}>
          <Input placeholder="Nhap tieu De thong bao" />
        </Form.Item>
        <Form.Item name="audience" label="Nguoi nhan" rules={[{ required: true }]}>
          <Select options={[
            { value: 'all', label: 'Tat ca nguoi dung' },
            { value: 'teachers', label: 'Giao vien' },
            { value: 'parents', label: 'Phu huynh' },
          ]} />
        </Form.Item>
        <Form.Item name="content" label="Noi dung" rules={[{ required: true }]}>
          <Input.TextArea rows={5} placeholder="Nhap noi dung thong bao" />
        </Form.Item>
      </FormModal>
    </>
  )
}

export default NotificationManagement
