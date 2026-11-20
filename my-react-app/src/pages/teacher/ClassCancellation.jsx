import { useState } from 'react'
import { Card, Col, Row, Select, Input, Alert, Button } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { ConfirmDialog } from '../../components/common/SharedStates'
import { classes } from '../../mocks/classes.mock'

function ClassCancellation() {
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  return (
    <>
      <PageHeader title="Xin huy buoi hoc" description="Gui yeu cau huy va thong bao Den hoc vien" breadcrumb={['Giao vien', 'Huy lop']} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="content-card" title="Thong tin buoi hoc">
            <label style={{ display: 'block', marginBottom: 6 }}>Lop hoc</label>
            <Select style={{ width: '100%', marginBottom: 16 }} defaultValue={classes[0].name} options={classes.map((item) => ({ value: item.name, label: item.name }))} />
            <label style={{ display: 'block', marginBottom: 6 }}>Buoi hoc</label>
            <Select style={{ width: '100%', marginBottom: 16 }} defaultValue="19/11/2026 - 18:00" options={[{ value: '19/11/2026 - 18:00', label: '19/11/2026 - 18:00' }]} />
            <label style={{ display: 'block', marginBottom: 6 }}>Ly do huy</label>
            <Input.TextArea rows={5} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhap ly do huy buoi hoc..." />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="content-card" title="Thong bao se gui">
            {reason ? (
              <Alert type="warning" showIcon message="Buoi hoc 19/11/2026 Da bi huy" description={`Ly do: ${reason}. Trung tam se thong bao lich hoc bu.`} />
            ) : (
              <Alert type="info" showIcon message="Nhap ly do de xem truoc thong bao" />
            )}
            <Button type="primary" danger block style={{ marginTop: 16 }} disabled={!reason} onClick={() => setOpen(true)}>Gui yeu cau huy</Button>
          </Card>
        </Col>
      </Row>
      <ConfirmDialog open={open} title="Xac nhan gui yeu cau" content="Yeu cau se Duoc gui Den quan tri vien va phu huynh sau khi Duoc phe duyet." onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)} />
    </>
  )
}

export default ClassCancellation
