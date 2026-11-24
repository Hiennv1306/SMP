import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Checkbox, DatePicker, Select, Table, message } from 'antd'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { teacherService } from '../../services/supabase/teacher.service'
import { createTuitionInvoices } from '../../services/supabase/tuition.service'

function TuitionNotifications() {
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState(null)
  const [selected, setSelected] = useState([])
  const [month, setMonth] = useState(dayjs())
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)

  const loadClasses = useCallback(async () => {
    setLoading(true)
    const { data, error } = await teacherService.listClasses()
    setLoading(false)
    if (error) {
      message.error(error.message || 'Khong the tai danh sach lop hoc.')
      setClasses([])
      return
    }
    const rows = data || []
    setClasses(rows)
    if (rows.length) setClassId((current) => current || rows[0].id)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadClasses, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadClasses])

  useEffect(() => {
    if (!classId || !month) {
      return
    }
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      const { data, error } = await teacherService.previewTuition(
        classId,
        month.format('MM/YYYY'),
      )
      setLoading(false)
      if (error) {
        message.error(error.message || 'Khong the tinh hoc phi.')
        setStudents([])
        setSelected([])
        return
      }
      const rows = data?.students || []
      setStudents(rows)
      setSelected(rows.map((item) => item.studentId))
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [classId, month])

  async function submit() {
    if (!selected.length) {
      message.warning('Vui long chon it nhat mot hoc vien.')
      return
    }

    setLoading(true)
    const { data, error } = await createTuitionInvoices({
      classId,
      studentIds: selected,
      billingMonth: month.format('MM/YYYY'),
    })
    setLoading(false)

    if (error) {
      message.error(error.message || 'Khong the tao hoa don hoc phi.')
      return
    }
    if (!data?.ok) {
      message.error(data?.code || 'Khong the tao thong bao hoc phi.')
      return
    }

    message.success(
      `Da tao ${data.createdCount} hoa don; cap nhat ${data.updatedCount} hoa don chua thanh toan; bo qua ${data.skippedCount} hoa don da xu ly.`,
    )
  }

  const columns = [
    {
      title: '',
      width: 45,
      render: (_, record) => (
        <Checkbox
          checked={selected.includes(record.studentId)}
          onChange={(event) =>
            setSelected((current) =>
              event.target.checked
                ? [...current, record.studentId]
                : current.filter((id) => id !== record.studentId),
            )
          }
        />
      ),
    },
    { title: 'Hoc vien', dataIndex: 'studentName', render: (value) => <strong>{value}</strong> },
    { title: 'Ma hoc vien', dataIndex: 'studentCode' },
    { title: 'Phu huynh', dataIndex: 'parentName' },
    { title: 'Buoi vang', dataIndex: 'absentCount', align: 'center' },
    { title: 'Buoi tinh tien', dataIndex: 'chargeableSessions', align: 'center' },
    { title: 'So tien', dataIndex: 'amount', render: (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ` },
  ]

  return (
    <>
      <PageHeader
        title="Thong bao hoc phi"
        description="Giao vien tao hoa don theo so buoi vang; Admin gui thong bao va xac nhan thu tien"
        breadcrumb={['Giao vien', 'Hoc phi']}
      />
      <Card className="content-card">
        <div className="toolbar">
          <Select
            style={{ width: 280 }}
            value={classId}
            onChange={setClassId}
            options={classes.map((item) => ({ value: item.id, label: item.class_name }))}
          />
          <DatePicker
            picker="month"
            style={{ width: 150 }}
            format="MM/YYYY"
            value={month}
            onChange={setMonth}
            allowClear={false}
          />
        </div>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Tao hoa don cho hoc sinh duoc chon: mac dinh 8 buoi/thang, tru buoi diem danh vang; buoi chua diem danh tinh la co mat. Admin se gui thong bao cho phu huynh."
        />

        <Table
          rowKey="studentId"
          dataSource={students}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: 700 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <StatusTag status="unpaid" text={`Hoa Don mac Dinh: Chua thanh toan`} />
          <Button type="primary" onClick={submit}>
            Tao hoa don cho hoc sinh da chon
          </Button>
        </div>
      </Card>
    </>
  )
}

export default TuitionNotifications
