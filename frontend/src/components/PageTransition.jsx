import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children }) {
  const location = useLocation()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.animation = 'none'
    el.offsetHeight
    el.style.animation = 'fadeInUp 0.35s ease forwards'
  }, [location.pathname])

  return (
    <div ref={ref} style={{ animation: 'fadeInUp 0.35s ease forwards' }}>
      {children}
    </div>
  )
}
