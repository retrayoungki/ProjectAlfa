import React from 'react'
import promanLogo from '../../assets/images/proman-logo.png'

/**
 * ProMan Logo — uses the original logo image with CSS filter
 * to render it in pure white. This preserves the exact shape
 * without any modification.
 */
export default function ProManLogo({ height = 43, collapsed = false }) {
  return (
    <img
      src={promanLogo}
      alt="ProMan"
      style={{
        height: collapsed ? 37 : height,
        width: 'auto',
        filter: 'brightness(0) invert(1)',
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        maxWidth: collapsed ? 49 : 'none',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  )
}
