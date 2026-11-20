import { useState } from 'react'
import { Alert, Button, Card, Checkbox, InputNumber, Select, Table, message } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { StatusTag } from '../../components/common/StatusTag'
import { students } from '../../mocks/students.mock'
import { classes } from '../../mocks/classes.mock'

function TuitionNotifications() {
  const [classId, setClassId] = useState(classes[0].id)
  const [selected, setSelected] = useState([])
  const [amount, setAmount] = useState(2400000)
  const [month, setMonth] = useState('11/2026')

  function submit() {
    if (!selected.length) {
      message.warning('Vui long chon it nhat mot hoc vien.')
      return
    }

    message.success(`Da tao ${selected.length} thong bao hoc phi va hoa Don tuong ung.`)
  }

  const columns = [
    {
      title: '',
      width: 45,
      render: (_, record) => (
        <Checkbox
          checked={selected.includes(record.id)}
          onChange={(event) =>
            setSelected((current) =>
              event.target.checked
                ? [...current, record.id]
                : current.filter((id) => id !== record.id),
            )
          }
        />
      ),
    },
    { title: 'Hoc vien', dataIndex: 'name', render: (value) => <strong>{value}</strong> },
    { title: 'Ma hoc vien', dataIndex: 'code' },
    { title: 'Phu huynh', dataIndex: 'parent' },
  ]

  return (
    <>
      <PageHeader
        title="Thong bao hoc phi"
        description="Chi tao hoa Don sau khi giao vien gui thong bao cho hoc vien"
        breadcrumb={['Giao vien', 'Hoc phi']}
      />
      <Card className="content-card">
        <div className="toolbar">
          <Select
            style={{ width: 280 }}
            value={classId}
            onChange={setClassId}
            options={classes.map((item) => ({ value: item.id, label: item.name }))}
          />
          <Select
            style={{ width: 160 }}
            value={month}
            onChange={setMonth}
            options={[
              { value: '11/2026', label: 'Thang 11/2026' },
              { value: '12/2026', label: 'Thang 12/2026' },
            ]}
          />
          <InputNumber
            min={0}
            style={{ width: 180 }}
            value={amount}
            onChange={(value) => setAmount(value || 0)}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          />
        </div>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Hoa Don chi Duoc tao khi giao vien bam gui thong bao."
        />

        <Table
          rowKey="id"
          dataSource={students}
          columns={columns}
          pagination={false}
          scroll={{ x: 700 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <StatusTag status="unpaid" text={`Hoa Don mac Dinh: Chua thanh toan`} />
          <Button type="primary" onClick={submit}>
            Gui thong bao va tao hoa Don
          </Button>
        </div>
      </Card>
    </>
  )
}

export default TuitionNotifications
