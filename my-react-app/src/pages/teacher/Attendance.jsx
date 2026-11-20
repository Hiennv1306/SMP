import { useState } from 'react'
import { Card, Select, Radio, Button, Row, Col, Statistic } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { UserAvatar } from '../../components/common/UserAvatar'
import { students } from '../../mocks/students.mock'

function Attendance() {
  const [attendance, setAttendance] = useState({})
  const presentCount = Object.values(attendance).filter((value) => value === 'present').length

  return (
    <>
      <PageHeader
        title="Diem danh"
        description="Diem danh hoc vien theo lop va buoi hoc"
        breadcrumb={['Giao vien', 'Diem danh']}
        extra={<Button type="primary">Luu Diem danh</Button>}
      />
      <Card className="content-card" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 6 }}>Lop hoc</label>
            <Select style={{ width: '100%' }} defaultValue="a2" options={[
              { value: 'a2', label: 'Tieng Anh Giao Tiep A2' },
              { value: 'toan6', label: 'Toan nang cao Lop 6' },
            ]} />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ display: 'block', marginBottom: 6 }}>Buoi hoc</label>
            <Select style={{ width: '100%' }} defaultValue="current" options={[
              { value: 'current', label: '19/11/2026 - 18:00' },
              { value: 'previous', label: '17/11/2026 - 18:00' },
            ]} />
          </Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          <Card className="content-card" title="Danh sach hoc vien">
            {students.map((student) => (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div className="table-avatar">
                  <UserAvatar name={student.name} />
                  <div className="table-avatar-copy"><strong>{student.name}</strong><span>{student.code}</span></div>
                </div>
                <Radio.Group
                  value={attendance[student.id]}
                  onChange={(event) => setAttendance((value) => ({ ...value, [student.id]: event.target.value }))}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  options={[
                    { value: 'present', label: 'Co mat' },
                    { value: 'excused', label: 'Phep' },
                    { value: 'absent', label: 'Khong phep' },
                    { value: 'late', label: 'Muon' },
                  ]}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card className="content-card" title="Tong hop">
            <Statistic title="Co mat" value={presentCount} suffix={`/ ${students.length}`} />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Attendance
