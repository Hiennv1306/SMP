import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

export function SearchInput({ value, onChange, placeholder = 'Tim kiem...' }) {
  return (
    <Input
      className="search-input"
      allowClear
      prefix={<SearchOutlined />}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}
