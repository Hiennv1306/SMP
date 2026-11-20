import { useState } from 'react'
import { Layout, Menu, Button, Badge, Input, Dropdown, Breadcrumb } from 'antd'
import {
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FormOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { roleMenus } from '../constants/roleMenus'
import { UserAvatar } from '../components/common/UserAvatar'
import { useAuth } from '../hooks/useAuth'

const iconMap = {
  dashboard: <DashboardOutlined />,
  team: <TeamOutlined />,
  book: <BookOutlined />,
  student: <UserOutlined />,
  wallet: <WalletOutlined />,
  bell: <BellOutlined />,
  calendar: <CalendarOutlined />,
  check: <CheckCircleOutlined />,
  cancel: <CloseCircleOutlined />,
  search: <SearchOutlined />,
  form: <FormOutlined />,
}

const roleLabels = {
  admin: 'Quan tri vien',
  teacher: 'Giao vien',
  parent: 'Phu huynh',
}

export function AppLayout({ role = 'admin' }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const menuItems = roleMenus[role].map((item) => ({
    key: item.key,
    icon: iconMap[item.icon],
    label: <NavLink to={item.key}>{item.label}</NavLink>,
  }))
  const currentMenu = roleMenus[role].find((item) => item.key === location.pathname)
  const pageTitle = currentMenu?.label || 'Tong quan'
  const roleName = roleLabels[role]

  const profileItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Ho so ca nhan' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cai Dat tai khoan' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Dang xuat', danger: true },
  ]

  async function handleProfileMenu({ key }) {
    if (key !== 'logout') return
    await signOut()
    navigate(role === 'admin' ? '/admin/login' : '/parent/login')
  }

  return (
    <Layout className="app-shell">
      <Layout.Sider
        width={248}
        collapsedWidth={80}
        collapsed={collapsed}
        collapsible
        trigger={null}
        theme="light"
        className="app-sider"
      >
        <div className="brand">
          <div className="brand-mark">E</div>
          {!collapsed && (
            <div className="brand-name">
              EduCenter
              <div style={{ color: '#8c96a8', fontSize: 11, marginTop: 3 }}>Quan ly giao duc</div>
            </div>
          )}
        </div>
        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Layout.Sider>

      <div className={`app-main ${collapsed ? 'collapsed' : ''}`}>
        <header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              aria-label="Mo dong menu"
            />
            <div>
              <Breadcrumb
                items={[
                  { title: roleName },
                  { title: pageTitle },
                ]}
                style={{ marginBottom: 2 }}
              />
              <strong style={{ color: '#172b4d', fontSize: 16 }}>{pageTitle}</strong>
            </div>
          </div>

          <div className="header-actions">
            <Input
              className="header-search"
              prefix={<SearchOutlined />}
              placeholder="Tim kiem..."
              style={{ width: 220 }}
            />
            <Badge count={3} size="small">
              <Button shape="circle" icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: profileItems, onClick: handleProfileMenu }} placement="bottomRight">
              <div className="header-user">
                <UserAvatar name={role === 'admin' ? 'Nguyen Quoc Anh' : role === 'teacher' ? 'Tran Minh Chau' : 'Le Thu Ha'} />
                <div className="header-user-copy">
                  <strong>{role === 'admin' ? 'Nguyen Quoc Anh' : role === 'teacher' ? 'Tran Minh Chau' : 'Le Thu Ha'}</strong>
                  <span>{roleName}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {role === 'parent' && (
        <nav className="mobile-bottom-nav" aria-label="Dieu huong phu huynh">
          {roleMenus.parent.slice(0, 5).map((item) => (
            <NavLink key={item.key} to={item.key} end={item.key === '/parent'}>
              {iconMap[item.icon]}
              <span>{item.label.replace('Con cua toi', 'Con').replace('Tim lop hoc', 'Tim lop')}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </Layout>
  )
}
