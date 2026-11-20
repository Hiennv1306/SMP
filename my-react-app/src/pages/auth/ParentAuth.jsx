import { useState } from 'react'
import { Button, Card, Form, Input, Tabs, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/supabase/auth.service'

function ParentAuth() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(values) {
    setLoading(true)
    const { data, error } = await authService.signInParent(values.phone, values.password)

    if (error) {
      message.error(error.message || 'Dang nhap that bai.')
      setLoading(false)
      return
    }

    if (data?.profile?.role === 'parent') {
      message.success('Dang nhap thanh cong.')
      navigate('/parent')
    }
    setLoading(false)
  }

  async function handleRegister(values) {
    setLoading(true)
    const { data, error } = await authService.signUpParent(values)

    if (error) {
      message.error(error.message || 'Dang ky that bai.')
      setLoading(false)
      return
    }

    if (data?.confirmationRequired) {
      message.success('Da gui ma xac nhan Den so Dien thoai. Vui long hoan tat xac nhan.')
    } else if (data?.profile?.role === 'parent') {
      message.success('Dang ky thanh cong.')
      navigate('/parent')
    }
    setLoading(false)
  }

  const loginForm = (
    <Form layout="vertical" onFinish={handleLogin}>
      <Form.Item name="phone" label="So Dien thoai" rules={[
        { required: true, message: 'Vui long nhap so Dien thoai.' },
        { pattern: /^(0|\+84|84)[0-9\s-]{8,14}$/, message: 'So Dien thoai khong hop le.' },
      ]}>
        <Input placeholder="0978..." />
      </Form.Item>
      <Form.Item name="password" label="Mat khau" rules={[{ required: true }]}>
        <Input.Password placeholder="Nhap mat khau" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        Dang nhap
      </Button>
    </Form>
  )

  const registerForm = (
    <Form layout="vertical" onFinish={handleRegister}>
      <Form.Item name="fullName" label="Ho va ten" rules={[{ required: true }]}>
        <Input placeholder="Ho va ten phu huynh" />
      </Form.Item>
      <Form.Item name="phone" label="So Dien thoai" rules={[
        { required: true, message: 'Vui long nhap so Dien thoai.' },
        { pattern: /^[0-9+\s]{9,15}$/, message: 'So Dien thoai khong hop le.' },
      ]}>
        <Input placeholder="0978..." />
      </Form.Item>
      <Form.Item name="childName" label="Ten con" rules={[{ required: true, message: 'Vui long nhap ten con.' }]}>
        <Input placeholder="Nhap ten con" />
      </Form.Item>
      <Form.Item name="childAge" label="Tuoi con" rules={[
        { required: true, message: 'Vui long nhap tuoi con.' },
      ]}>
        <Input type="number" min={1} max={99} placeholder="Vi du: 10" />
      </Form.Item>
      <Form.Item name="gradeLevel" label="Lop" rules={[{ required: true, message: 'Vui long nhap lop.' }]}>
        <Input placeholder="Vi du: Lop 5" />
      </Form.Item>
      <div style={{ color: '#8c96a8', fontSize: 12, marginBottom: 12 }}>
        Mot tai khoan theo so Dien thoai co the quan ly toi Da 2 con.
      </div>
      <Form.Item name="password" label="Mat khau" rules={[
        { required: true, message: 'Vui long nhap mat khau.' },
        { min: 8, message: 'Mat khau toi thieu 8 ky tu.' },
      ]}>
        <Input.Password placeholder="Toi thieu 8 ky tu" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Nhap lai mat khau"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Vui long nhap lai mat khau.' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              return !value || getFieldValue('password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('Mat khau nhap lai khong khop.'))
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        Dang ky phu huynh
      </Button>
    </Form>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#f5f7fb' }}>
      <Card className="content-card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="brand-mark" style={{ margin: '0 auto 12px' }}>E</div>
          <h1 style={{ fontSize: 24, margin: 0 }}>EduCenter</h1>
          <p style={{ color: '#8c96a8', marginTop: 6 }}>Tai khoan phu huynh</p>
        </div>
        <Tabs
          items={[
            { key: 'login', label: 'Dang nhap', children: loginForm },
            { key: 'register', label: 'Dang ky', children: registerForm },
          ]}
        />
      </Card>
    </div>
  )
}

export default ParentAuth
