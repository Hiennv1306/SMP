import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Progress, Row, Tag, Empty, message, Drawer, Radio, DatePicker, Button, Statistic } from 'antd'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { teacherService } from '../../services/supabase/teacher.service'

const dayNames = {
  1: 'Thu Hai',
  2: 'Thu Ba',
  3: 'Thu Tu',
  4: 'Thu Nam',
  5: 'Thu Sau',
  6: 'Thu Bay',
  7: 'Chu Nhat',
}

function MyClasses() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [sessionDate, setSessionDate] = useState(dayjs())
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadClasses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await teacherService.listClasses()
    if (error) {
      message.error(error.message || 'Không thể tải lớp học của giáo viên.')
      setClasses([])
    } else {
      setClasses(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadClasses, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadClasses])

  const loadClassDetail = useCallback(async (classId, date) => {
    setDetailLoading(true)
    const { data, error } = await teacherService.getClassDetail(
      classId,
      date.format('YYYY-MM-DD'),
    )

    if (error) {
      message.error(error.message || 'Khong the tai danh sach hoc vien.')
      setStudents([])
      setAttendance({})
    } else {
      const detailStudents = data?.students || []
      setStudents(detailStudents)
      setAttendance(Object.fromEntries(
        detailStudents.map((student) => [student.id, student.attendanceStatus || 'present']),
      ))
    }
    setDetailLoading(false)
  }, [])

  function openClassDetail(item) {
    setSelectedClass(item)
    setDrawerOpen(true)
    loadClassDetail(item.id, sessionDate)
  }

  function changeSessionDate(date) {
    setSessionDate(date)
    if (selectedClass && date) {
      loadClassDetail(selectedClass.id, date)
    }
  }

  async function saveAttendance() {
    if (!selectedClass) return
    setSaving(true)
    const rows = students.map((student) => ({
      student_id: student.id,
      status: attendance[student.id] || 'present',
      note: '',
    }))

    const { error } = await teacherService.saveClassAttendance(
      selectedClass.id,
      sessionDate.format('YYYY-MM-DD'),
      rows,
    )
    setSaving(false)

    if (error) {
      message.error(error.message || 'Khong the luu diem danh.')
      return
    }

    message.success('Da luu diem danh cho lop hoc.')
  }

  const presentCount = Object.values(attendance).filter((status) => status === 'present').length

  return (
    <>
      <PageHeader title="Lớp của tôi"  />
      {loading ? (
        <Card className="content-card">Dang tai lop hoc...</Card>
      ) : classes.length ? (
        <Row gutter={[16, 16]}>
          {classes.map((item) => (
            <Col xs={24} md={12} xl={8} key={item.id}>
              <Card
                className="class-card"
                title={item.class_name}
                extra={<StatusTag status={item.status === 'open' ? 'active' : item.status} />}
                loading={loading}
                hoverable
                onClick={() => openClassDetail(item)}
              >
                <p><strong>Mo ta:</strong> {item.description || 'Chua co mo ta'}</p>
                <p><strong>Do tuoi:</strong> {item.min_age}-{item.max_age} tuoi</p>
                <p><strong>Lich hoc:</strong></p>
                {(item.schedules || []).map((schedule) => (
                  <Tag key={schedule.id} color="blue" style={{ marginBottom: 6 }}>
                    {dayNames[schedule.day_of_week]}: {String(schedule.start_time).slice(0, 5)} - {String(schedule.end_time).slice(0, 5)}
                  </Tag>
                ))}
                {!item.schedules?.length && <p>Chua cau hinh lich hoc</p>}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span>Si so lop</span>
                    <strong>{item.enrolled}/{item.max_students}</strong>
                  </div>
                  <Progress percent={item.max_students ? Math.round(item.enrolled / item.max_students * 100) : 0} />
                </div>
                <Tag color="geekblue" style={{ marginTop: 12 }}>Ma lop: EDU-{item.id.toString().padStart(3, '0')}</Tag>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="content-card">
          <Empty description="Giao vien chua duoc phan cong lop hoc" />
        </Card>
      )}

      <Drawer
        title={selectedClass?.class_name || 'Chi tiet lop hoc'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
      >
        {selectedClass && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <strong>Ngay diem danh</strong>
              </div>
              <DatePicker
                value={sessionDate}
                format="DD/MM/YYYY"
                onChange={changeSessionDate}
                allowClear={false}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <Card size="small">
                <Statistic title="Tong hoc vien" value={students.length} />
              </Card>
              <Card size="small">
                <Statistic title="Co mat" value={presentCount} />
              </Card>
              <Card size="small">
                <Statistic title="Suc chua" value={`${selectedClass.enrolled}/${selectedClass.max_students}`} />
              </Card>
            </div>

            <Card
              size="small"
              title="Danh sach hoc vien"
              loading={detailLoading}
            >
              {students.length ? students.map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div>
                    <strong>{student.fullName}</strong>
                    <div style={{ color: '#8c96a8', fontSize: 12, marginTop: 2 }}>
                      {student.gradeLevel || 'Chua co lop'} • {student.age} tuoi
                    </div>
                  </div>
                  <Radio.Group
                    value={attendance[student.id]}
                    onChange={(event) => setAttendance((current) => ({
                      ...current,
                      [student.id]: event.target.value,
                    }))}
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
              )) : (
                <Empty description="Chua co hoc vien ghi danh vao lop" />
              )}
            </Card>

            <Button
              type="primary"
              block
              loading={saving}
              disabled={!students.length}
              onClick={saveAttendance}
              style={{ marginTop: 16 }}
            >
              Luu diem danh
            </Button>
          </>
        )}
      </Drawer>
    </>
  )
}

export default MyClasses
