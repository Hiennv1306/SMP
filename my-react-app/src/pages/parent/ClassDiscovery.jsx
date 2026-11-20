import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Col, Row, Select, Tag, Empty, message } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { SearchInput } from '../../components/common/SearchInput'
import { StatusTag } from '../../components/common/StatusTag'
import { parentService } from '../../services/supabase/parent.service'

const dayNames = {
  1: 'Thu Hai',
  2: 'Thu Ba',
  3: 'Thu Tu',
  4: 'Thu Nam',
  5: 'Thu Sau',
  6: 'Thu Bay',
  7: 'Chu Nhat',
}

function ClassDiscovery() {
  const [search, setSearch] = useState('')
  const [children, setChildren] = useState([])
  const [studentId, setStudentId] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  const loadChildren = useCallback(async () => {
    const { data, error } = await parentService.getChildren()
    if (error) {
      message.error(error.message || 'Khong the tai thong tin con.')
      return
    }

    const activeChildren = (data?.students || []).filter((item) => item.status !== 'inactive')
    setChildren(activeChildren)
    if (activeChildren.length) setStudentId(activeChildren[0].id)
  }, [])

  const loadClasses = useCallback(async (selectedStudentId) => {
    if (!selectedStudentId) {
      setClasses([])
      return
    }

    setLoading(true)
    const { data, error } = await parentService.discoverClasses(selectedStudentId)
    setLoading(false)

    if (error) {
      message.error(error.message || 'Khong the tai danh sach lop.')
      setClasses([])
      return
    }
    if (data?.ok) setClasses(data.data || [])
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadChildren, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadChildren])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadClasses(studentId), 0)
    return () => window.clearTimeout(timeoutId)
  }, [studentId, loadClasses])

  const filtered = classes.filter((item) =>
    item.className.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <>
      <PageHeader title="Tim lop hoc" description="Tim lop phu hop voi lich hoc va nhu cau cua con" breadcrumb={['Phu huynh', 'Tim lop hoc']} />
      <Card className="content-card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim lop hoc..." />
          <Select
            style={{ width: 220 }}
            value={studentId}
            onChange={setStudentId}
            placeholder="Chon con"
            options={children.map((item) => ({
              value: item.id,
              label: `${item.full_name} - ${item.age} tuoi`,
            }))}
          />
        </div>
      </Card>
      {loading ? (
        <Card className="content-card">Dang tai lop hoc...</Card>
      ) : filtered.length ? (
        <Row gutter={[16, 16]}>
          {filtered.map((item) => (
            <Col xs={24} md={12} xl={8} key={item.id}>
              <Card className="class-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{item.className}</strong>
                  <StatusTag status="active" text={`Con ${item.availableSeats} cho`} />
                </div>
                <p style={{ color: '#7b8496', marginTop: 12 }}>Giao vien: {item.teacherName}</p>
                <Tag color="blue">{item.minAge}-{item.maxAge} tuoi</Tag>
                <div style={{ marginTop: 12 }}>
                  {(item.schedules || []).map((schedule) => (
                    <Tag key={`${item.id}-${schedule.dayOfWeek}`} color="geekblue">
                      {dayNames[schedule.dayOfWeek]}: {schedule.startTime} - {schedule.endTime}
                    </Tag>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" href="/parent/enrollment" block>Dang ky lop</Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="content-card">
          <Empty description="Khong co lop phu hop voi Do tuoi hoac lop Da day" />
        </Card>
      )}
    </>
  )
}

export default ClassDiscovery
