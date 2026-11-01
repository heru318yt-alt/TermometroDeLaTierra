import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import landPaths from '../../assets/world-land.json'

type Props = { color: string; label: string; anomaly: string }
type Drag = { x: number; y: number; longitude: number; tilt: number }

const sourceWidth = 720
const sourceHeight = 380
const mapWidth = 360
const mapHeight = 180
const globeSize = 440
const radians = Math.PI / 180

function makeLandMask() {
  if (typeof Path2D === 'undefined' || typeof CanvasRenderingContext2D === 'undefined') return new Uint8Array(mapWidth * mapHeight)
  const source = document.createElement('canvas')
  source.width = sourceWidth
  source.height = sourceHeight
  const context = source.getContext('2d')
  if (!context || typeof Path2D === 'undefined') return new Uint8Array(mapWidth * mapHeight)
  context.fillStyle = '#fff'
  for (const path of landPaths) context.fill(new Path2D(path), 'evenodd')
  const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data
  const mask = new Uint8Array(mapWidth * mapHeight)
  for (let y = 0; y < mapHeight; y++) {
    const latitude = 90 - (y + .5) * 180 / mapHeight
    const envelope = Math.sqrt(1 - (latitude / 110) ** 2)
    const sourceY = Math.round(190 - latitude / 90 * 165)
    for (let x = 0; x < mapWidth; x++) {
      const longitude = -180 + (x + .5) * 360 / mapWidth
      const sourceX = Math.round(360 + longitude / 180 * 345 * envelope)
      const index = (sourceY * sourceWidth + sourceX) * 4 + 3
      mask[y * mapWidth + x] = pixels[index] > 0 ? 1 : 0
    }
  }
  return mask
}

function colorChannels(value: string) {
  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const context = probe.getContext('2d')
  if (!context) return [190, 200, 190]
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)]
}

function renderGlobe(canvas: HTMLCanvasElement, mask: Uint8Array, color: string, longitude: number, tilt: number) {
  if (typeof CanvasRenderingContext2D === 'undefined') return
  const context = canvas.getContext('2d')
  if (!context) return
  const size = canvas.width
  const image = context.createImageData(size, size)
  const [oceanR, oceanG, oceanB] = colorChannels(color)
  const angle = longitude * radians, pitch = tilt * radians
  const cosAngle = Math.cos(angle), sinAngle = Math.sin(angle)
  const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch)
  const lightX = -.42, lightY = .50, lightZ = .76

  for (let py = 0; py < size; py++) {
    const y = (size / 2 - py - .5) / (size * .47)
    for (let px = 0; px < size; px++) {
      const x = (px + .5 - size / 2) / (size * .47)
      const radius = x * x + y * y
      if (radius > 1) continue
      const z = Math.sqrt(1 - radius)
      const rotatedX = x * cosAngle + z * sinAngle
      const rotatedZ = -x * sinAngle + z * cosAngle
      const rotatedY = y * cosPitch - rotatedZ * sinPitch
      const frontZ = y * sinPitch + rotatedZ * cosPitch
      const latitude = Math.asin(Math.max(-1, Math.min(1, rotatedY)))
      const mapLongitude = Math.atan2(rotatedX, frontZ)
      const landX = Math.min(mapWidth - 1, Math.max(0, Math.floor((mapLongitude / (2 * Math.PI) + .5) * mapWidth)))
      const landY = Math.min(mapHeight - 1, Math.max(0, Math.floor((.5 - latitude / Math.PI) * mapHeight)))
      const isLand = mask[landY * mapWidth + landX] === 1
      const diffuse = Math.max(0, x * lightX + y * lightY + z * lightZ)
      const shade = .34 + diffuse * .76
      const grid = Math.abs(Math.cos(latitude * 6)) < .018 || Math.abs(Math.sin(mapLongitude * 6)) < .018
      const base = isLand ? [35, 82, 68] : [oceanR, oceanG, oceanB]
      const index = (py * size + px) * 4
      const gridShade = grid ? .88 : 1
      image.data[index] = Math.round(base[0] * shade * gridShade)
      image.data[index + 1] = Math.round(base[1] * shade * gridShade)
      image.data[index + 2] = Math.round(base[2] * shade * gridShade)
      image.data[index + 3] = 255
    }
  }
  context.clearRect(0, 0, size, size)
  context.putImageData(image, 0, 0)
  context.beginPath()
  context.arc(size / 2, size / 2, size * .47, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(45, 79, 64, .25)'
  context.lineWidth = 1.5
  context.stroke()
}

export function InteractiveGlobe({ color, label, anomaly }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskRef = useRef<Uint8Array | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [longitude, setLongitude] = useState(-70)
  const [tilt, setTilt] = useState(8)
  const [maskReady, setMaskReady] = useState(false)

  useEffect(() => {
    try {
      maskRef.current = makeLandMask()
      setMaskReady(true)
    } catch {
      // Some test canvases do not expose Path2D or pixel reads; the page content remains available.
    }
  }, [])

  useEffect(() => {
    try {
      const canvas = canvasRef.current
      if (canvas && maskRef.current) renderGlobe(canvas, maskRef.current, color, longitude, tilt)
    } catch {
      // Canvas rendering is decorative; the selected value remains readable in the page text.
    }
  }, [color, longitude, tilt, maskReady])

  const startDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY, longitude, tilt }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    setLongitude(drag.longitude + (event.clientX - drag.x) * .65)
    setTilt(Math.max(-48, Math.min(48, drag.tilt - (event.clientY - drag.y) * .42)))
  }
  const endDrag = () => { dragRef.current = null }
  const rotateByKey = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setLongitude(value => value - 12) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); setLongitude(value => value + 12) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setTilt(value => Math.min(48, value + 8)) }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setTilt(value => Math.max(-48, value - 8)) }
  }

  return <div className="globe-interaction">
    <canvas ref={canvasRef} className="world-globe" width={globeSize} height={globeSize}
      role="img" tabIndex={0} aria-label={`Globo giratorio, ${label}: ${anomaly}. La anomalía se muestra igual en todo el océano, no es un mapa regional.`}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={rotateByKey} />
    <div className="globe-help"><span>Arrastra para girar · usa las flechas del teclado</span><button type="button" onClick={() => { setLongitude(-70); setTilt(8) }}>Restablecer vista</button></div>
  </div>
}
