import { useLocation, useNavigate } from 'react-router-dom'
import { BOTTOM_NAV } from '../../constants/navigation'

export default function MobileBottomNav({ closeMobile }) {
  const location = useLocation()
  const navigate  = useNavigate()

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {BOTTOM_NAV.map(item => {
        const Icon   = item.icon
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`mobile-nav-btn${active ? ' active' : ''}`}
            onClick={() => { navigate(item.path); closeMobile() }}
            aria-label={item.label}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
