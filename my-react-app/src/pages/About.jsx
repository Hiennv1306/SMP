import { Link } from 'react-router-dom'

function About() {
  return (
    <section id="center">
      <h1>Gioi thieu</h1>
      <p>Day la trang gioi thieu cua ung dung React.</p>
      <Link to="/" className="counter">Ve trang chu</Link>
    </section>
  )
}

export default About
