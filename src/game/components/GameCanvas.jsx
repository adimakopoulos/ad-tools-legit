import React from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/Renderer'

export default function GameCanvas({ canvasRef, onClick, onContextMenu, style }) {
  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: onClick ? 'crosshair' : 'default',
        ...style,
      }}
    />
  )
}
