import { Card, Col, Row, Steps, Tag, Button, Alert, Select, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { parentService } from '../../services/supabase/parent.service'
import { enrollStudent } from '../../services/supabase/enrollment.service'

function Enrollment() {
  const navigate = useNavigate()
  const [children, setChildren] = useState([])
  const [availableClasses, setAvailableClasses] = useState([])
  const [studentId, setStudentId] = useState(null)
  const [classId, setClassId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [completedEnrollment, setCompletedEnrollment] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  const loadChildren = useCallback(async () => {
    const { data, error } = await parentService.getChildren()
    if (error) {
      message.error(error.message || 'Khong the tai danh sach con.')
      return
    }

    const activeChildren = (data?.students || []).filter((item) => item.status !== 'inactive')
    setChildren(activeChildren)
    if (activeChildren.length) setStudentId(activeChildren[0].id)
  }, [])

  const loadAvailableClasses = useCallback(async (selectedStudentId) => {
    if (!selectedStudentId) {
      setAvailableClasses([])
      setClassId(null)
      return
    }

    const { data, error } = await parentService.discoverClasses(selectedStudentId)
    if (error) {
      message.error(error.message || 'Khong the tai danh sach lop.')
      setAvailableClasses([])
      setClassId(null)
      return
    }

    if (data?.ok) {
      const options = data.data || []
      setAvailableClasses(options)
      setClassId(options[0]?.id || null)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadChildren, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadChildren])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadAvailableClasses(studentId), 0)
    return () => window.clearTimeout(timeoutId)
  }, [studentId, loadAvailableClasses])

  async function submitEnrollment() {
    if (!studentId || !classId) {
      message.warning('Vui long chon con va lop hoc con cho.')
      return
    }

    setSubmitting(true)
    const { data, error } = await enrollStudent(studentId, classId)
    setSubmitting(false)

    if (error) {
      message.error(error.message || 'Khong the ghi danh.')
      return
    }
    if (!data?.ok) {
      const messages = {
        CLASS_FULL: 'Lop Da du hoc vien.',
        ALREADY_ENROLLED: 'Con Da ghi danh lop nay.',
        AGE_NOT_ELIGIBLE: 'Con khong phu hop Do tuoi lop hoc.',
        CLASS_CLOSED: 'Lop Da dong ghi danh.',
        NOT_STUDENT_OWNER: 'Con khong thuoc tai khoan phu huynh nay.',
      }
      message.error(messages[data?.code] || data?.code || 'Ghi danh that bai.')
      return
    }

    const enrolledClass = availableClasses.find((item) => item.id === classId)
    setCompletedEnrollment({
      studentId,
      classId,
      className: enrolledClass?.className || '',
    })
    setCurrentStep(2)
    message.success('Ghi danh thanh cong. Khong co hoc phi nao Duoc yeu cau.')
    navigate('/parent/enrollment', { replace: true, state: { enrolled: true, classId } })
    await loadAvailableClasses(studentId)
  }

  return (
    <>
      <PageHeader title="Ghi danh lop hoc" description="Ghi danh lop thanh cong ma khong yeu cau thanh toan ngay" breadcrumb={['Phu huynh', 'Ghi danh']} />
      <Card className="content-card" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStep}
          items={[
            { title: 'Chon lop' },
            { title: 'Thong tin hoc vien' },
            { title: 'Hoan tat' },
          ]}
        />
      </Card>
      <Row gutter={[16, 16]}>
        {completedEnrollment && (
          <Col xs={24}>
            <Alert
              type="success"
              showIcon
              message="Ghi danh thanh cong"
              description={`Da ghi danh vao lop ${completedEnrollment.className}. Lop se xu ly va khong yeu cau thanh toan ngay.`}
            />
          </Col>
        )}
        <Col xs={24}>
          <Card className="content-card" title="Dang ky lop moi">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <label style={{ display: 'block', marginBottom: 6 }}>Chon con</label>
                <Select
                  style={{ width: '100%' }}
                  value={studentId}
                  onChange={setStudentId}
                  options={children.map((item) => ({
                    value: item.id,
                    label: `${item.full_name} - ${item.age} tuoi`,
                  }))}
                />
              </Col>
              <Col xs={24} md={12}>
                <label style={{ display: 'block', marginBottom: 6 }}>Chon lop con cho</label>
                <Select
                  style={{ width: '100%' }}
                  value={classId}
                  onChange={setClassId}
                  options={availableClasses.map((item) => ({
                    value: item.id,
                    label: `${item.className} - con ${item.availableSeats} cho`,
                  }))}
                  placeholder="Khong co lop phu hop"
                />
              </Col>
            </Row>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="Ghi danh khong yeu cau thanh toan ngay."
              description="Hoc phi chi Duoc tao khi giao vien gui thong bao hoc phi cho hoc vien."
            />
            <Button type="primary" loading={submitting} onClick={submitEnrollment} style={{ marginTop: 16 }}>
              Hoan tat ghi danh
            </Button>
          </Card>
        </Col>
        {availableClasses.map((item) => (
          <Col xs={24} md={12} key={item.id}>
            <Card className="content-card" title={item.className} extra={<StatusTag status="active" text="Con cho" />}>
              <p><strong>Giao vien:</strong> {item.teacherName}</p>
              <p><strong>Do tuoi:</strong> {item.minAge}-{item.maxAge} tuoi</p>
              <p><strong>Suc chua:</strong> {item.enrolled}/{item.maxStudents}</p>
              {item.schedules?.map((schedule) => (
                <Tag key={`${item.id}-${schedule.dayOfWeek}`} color="blue">
                  {schedule.dayName}: {schedule.startTime} - {schedule.endTime}
                </Tag>
              ))}
            </Card>
          </Col>
        ))}
      </Row>
      <Alert style={{ marginTop: 16 }} type="info" showIcon message="Ghi danh ket thuc sau khi lop xac nhan suc chua. Hoc phi se Duoc thong bao rieng sau." />
    </>
  )
}

export default Enrollment
