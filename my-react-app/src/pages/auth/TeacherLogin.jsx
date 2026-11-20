import { useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/supabase/auth.service'

function TeacherLogin() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(values) {
    setLoading(true)
    const { data, error } = await authService.signInTeacher(values.email, values.password)

    if (error) {
      message.error(error.message || 'Dang nhap giao vien khong thanh cong.')
      setLoading(false)
      return
    }

    if (data?.profile?.role === 'teacher') {
      message.success('Dang nhap thanh cong.')
      navigate('/teacher')
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f5f7fb' }}>
      <Card className="content-card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-mark" style={{ margin: '0 auto 12px' }}>E</div>
          <h1 style={{ fontSize: 24, margin: 0 }}>EduCenter</h1>
          <p style={{ color: '#8c96a8', marginTop: 6 }}>Dang nhap tai khoan giao vien</p>
        </div>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="email@educenter.vn" />
          </Form.Item>
          <Form.Item name="password" label="Mat khau" rules={[{ required: true }]}>
            <Input.Password placeholder="Nhap mat khau" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Dang nhap
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default TeacherLogin
