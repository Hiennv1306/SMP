import { Button, Card, Col, Form, Input, Row } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { message } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { UserAvatar } from '../../components/common/UserAvatar'
import { FormModal } from '../../components/common/FormModal'
import { parentService } from '../../services/supabase/parent.service'

function ChildrenManagement() {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([
    { id: 1, full_name: 'Nguyen Minh Anh', age: 13, grade_level: 'Lop 7', status: 'active' },
    { id: 2, full_name: 'Nguyen Gia Bao', age: 9, grade_level: 'Lop 3', status: 'active' },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    parentService.getChildren().then(({ data, error }) => {
      if (active && !error && data?.students) setChildren(data.students)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleAdd(values) {
    if (children.filter((child) => child.status !== 'inactive').length >= 2) {
      message.warning('Moi so Dien thoai chi quan ly toi Da 2 con.')
      return
    }

    setLoading(true)
    const { data, error } = await parentService.addChild({
      fullName: values.name,
      age: Number(values.age),
      gradeLevel: values.gradeLevel,
    })

    if (error) {
      message.error(error.message || 'Khong the them con.')
    } else if (data) {
      setChildren((current) => [...current, data])
      setOpen(false)
      message.success('Da them thong tin con.')
    }
    setLoading(false)
  }
  return (
    <>
      <PageHeader
        title="Con cua toi"
        description={`Mot so Dien thoai quan ly toi Da 2 con (${children.filter((child) => child.status !== 'inactive').length}/2)`}
        breadcrumb={['Phu huynh', 'Con cua toi']}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={children.filter((child) => child.status !== 'inactive').length >= 2}
            onClick={() => setOpen(true)}
          >
            Them con
          </Button>
        }
      />
      <Row gutter={[16, 16]}>
        {children.map((child) => (
          <Col xs={24} md={12} key={child.id || child.full_name}>
            <Card className="content-card">
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <UserAvatar name={child.full_name || child.name} size={56} />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16 }}>{child.full_name || child.name}</strong>
                  <div style={{ color: '#8c96a8', marginTop: 4 }}>{child.age} tuoi a€¢ {child.grade_level || child.school}</div>
                  <div style={{ color: '#1677ff', marginTop: 8 }}>
                    {child.status === 'inactive' ? 'Tam dung' : 'Dang hoat Dong'}
                  </div>
                </div>
                <Button icon={<EditOutlined />} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <FormModal
        open={open}
        title="Them thong tin con"
        onCancel={() => setOpen(false)}
        onSubmit={handleAdd}
        confirmLoading={loading}
      >
        <Form.Item name="name" label="Ho va ten" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="age" label="Do tuoi" rules={[{ required: true }]}>
          <Input type="number" min={1} max={99} />
        </Form.Item>
        <Form.Item name="gradeLevel" label="Khoi/lop Dang hoc">
          <Input />
        </Form.Item>
      </FormModal>
    </>
  )
}

export default ChildrenManagement
