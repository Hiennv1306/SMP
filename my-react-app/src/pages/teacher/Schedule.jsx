import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Row, Select, TimePicker, Tag } from 'antd'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/common/PageHeader'
import { classes } from '../../mocks/classes.mock'

const days = [
  { value: 1, label: 'Thu Hai' },
  { value: 2, label: 'Thu Ba' },
  { value: 3, label: 'Thu Tu' },
  { value: 4, label: 'Thu Nam' },
  { value: 5, label: 'Thu Sau' },
  { value: 6, label: 'Thu Bay' },
  { value: 7, label: 'Chu Nhat' },
]

function addMinutes(time, minutes) {
  return time ? time.add(minutes, 'minute') : null
}

function Schedule() {
  const [classId, setClassId] = useState(classes[0].id)
  const [firstDay, setFirstDay] = useState(1)
  const [secondDay, setSecondDay] = useState(4)
  const [firstStart, setFirstStart] = useState(dayjs('2026-11-19 18:00'))
  const [secondStart, setSecondStart] = useState(dayjs('2026-11-19 18:00'))
  const [message, setMessage] = useState(null)

  const firstEnd = useMemo(() => addMinutes(firstStart, 90), [firstStart])
  const secondEnd = useMemo(() => addMinutes(secondStart, 90), [secondStart])

  const validationError = useMemo(() => {
    if (firstDay === secondDay) return 'Hai buoi hoc phai Dat vao hai ngay khac nhau.'
    if (!firstStart || !secondStart) return 'Vui long chon gio bat Dau cho ca hai buoi.'
    if (!firstEnd || !secondEnd) return 'Khong the tinh gio ket thuc.'
    if (firstEnd.diff(firstStart, 'minute') !== 90 || secondEnd.diff(secondStart, 'minute') !== 90) {
      return 'Moi buoi hoc phai keo dai Dung 90 phut.'
    }
    return null
  }, [firstDay, secondDay, firstStart, secondStart, firstEnd, secondEnd])

  function saveSchedule() {
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setMessage({
      type: 'success',
      text: `Da luu lich cho lop ${classes.find((item) => item.id === classId)?.name}.`,
    })
  }

  return (
    <>
      <PageHeader
        title="Cau hinh lich hoc"
        description="Moi lop toi Da hai buoi moi tuan, hai ngay khac nhau va dung 90 phut"
        breadcrumb={['Giao vien', 'Lich day']}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="content-card" title="Thong tin lich">
            <label style={{ display: 'block', marginBottom: 6 }}>Lop hoc</label>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              value={classId}
              onChange={setClassId}
              options={classes.map((item) => ({ value: item.id, label: item.name }))}
            />

            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Buoi hoc thu nhat">
                  <label style={{ display: 'block', marginBottom: 6 }}>Ngay trong tuan</label>
                  <Select
                    style={{ width: '100%', marginBottom: 12 }}
                    value={firstDay}
                    onChange={setFirstDay}
                    options={days}
                  />
                  <label style={{ display: 'block', marginBottom: 6 }}>Gio bat Dau</label>
                  <TimePicker
                    format="HH:mm"
                    minuteStep={30}
                    value={firstStart}
                    onChange={setFirstStart}
                    style={{ width: '100%' }}
                  />
                  <div style={{ marginTop: 12 }}>
                    Gio ket thuc: <Tag color="blue">{firstEnd?.format('HH:mm') || '--:--'}</Tag>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card size="small" title="Buoi hoc thu hai">
                  <label style={{ display: 'block', marginBottom: 6 }}>Ngay trong tuan</label>
                  <Select
                    style={{ width: '100%', marginBottom: 12 }}
                    value={secondDay}
                    onChange={setSecondDay}
                    options={days}
                  />
                  <label style={{ display: 'block', marginBottom: 6 }}>Gio bat Dau</label>
                  <TimePicker
                    format="HH:mm"
                    minuteStep={30}
                    value={secondStart}
                    onChange={setSecondStart}
                    style={{ width: '100%' }}
                  />
                  <div style={{ marginTop: 12 }}>
                    Gio ket thuc: <Tag color="blue">{secondEnd?.format('HH:mm') || '--:--'}</Tag>
                  </div>
                </Card>
              </Col>
            </Row>

            <Button type="primary" style={{ marginTop: 16 }} onClick={saveSchedule}>
              Luu lich hoc
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="content-card" title="Xem truoc lich tuan">
            {validationError && <Alert type="error" showIcon message={validationError} style={{ marginBottom: 12 }} />}
            {!validationError && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <strong>{days.find((day) => day.value === firstDay)?.label}</strong>
                  <Tag color="blue">{firstStart?.format('HH:mm')} - {firstEnd?.format('HH:mm')} • 90 phut</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{days.find((day) => day.value === secondDay)?.label}</strong>
                  <Tag color="blue">{secondStart?.format('HH:mm')} - {secondEnd?.format('HH:mm')} • 90 phut</Tag>
                </div>
              </>
            )}
            {message && (
              <Alert
                type={message.type}
                showIcon
                message={message.text}
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Schedule
