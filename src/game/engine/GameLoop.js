export class GameLoop {
  constructor(onFrame) {
    this.onFrame = onFrame
    this.running = false
    this.lastTime = 0
    this.rafId = null
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  tick = (now) => {
    if (!this.running) return
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    this.onFrame(deltaTime)
    this.rafId = requestAnimationFrame(this.tick)
  }
}
