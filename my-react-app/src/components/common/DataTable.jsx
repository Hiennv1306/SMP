import { Table } from 'antd'

export function DataTable({ columns, dataSource, rowKey = 'id', pagination = true, scrollX = 900, loading = false }) {
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      size="middle"
      scroll={{ x: scrollX }}
      loading={loading}
      pagination={pagination === true ? { pageSize: 8, showSizeChanger: false } : pagination}
    />
  )
}
