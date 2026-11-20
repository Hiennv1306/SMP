import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section id="center">
      <h1>404</h1>
      <p>Khong tim thay trang ban yeu cau.</p>
      <Link to="/" className="counter">Ve trang chu</Link>
    </section>
  )
}

export default NotFound
