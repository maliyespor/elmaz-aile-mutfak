import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Envanter', icon: '🧊', end: true },
  { to: '/liste', label: 'Liste', icon: '📝' },
  { to: '/ayarlar', label: 'Ayarlar', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {link.icon}
          </span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
