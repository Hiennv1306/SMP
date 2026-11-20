import { Modal, Form } from 'antd'

export function FormModal({ open, title, onCancel, onSubmit, children, submitText = 'Luu', confirmLoading = false }) {
  const [form] = Form.useForm()

  function handleSubmit() {
    form.validateFields().then(onSubmit).catch(() => {})
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={submitText}
      cancelText="Huy"
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {children}
      </Form>
    </Modal>
  )
}
