/**
 * Mecánica de arrastre y suelta («tirachinas») diferenciada por transporte
 * para «Carga entre ciudades». Lógica pura sin dependencias de DOM.
 */
import { MIN_POWER, MODES, effectiveAngle, type Mode } from './engine'

export interface Point {
  x: number
  y: number
}

export interface ModeControlProfile {
  /** Desplazamiento mínimo (px lógicos) desde el agarre para armar el tiro. */
  pullMin: number
  /** Desplazamiento máximo (px lógicos) donde alcanza 100 % de potencia. */
  pullMax: number
  /** Ángulo mínimo permitido en el modo. */
  minAngle: number
  /** Ángulo máximo permitido en el modo. */
  maxAngle: number
  /** Ángulo fijo cuando el transporte corre sobre una vía fija (p. ej. ferrocarril). */
  angleLocked: number | null
  /** Factor de suavizado por respuesta (1 = inmediato, <1 = inercia pesada). */
  smoothing: number
  /** Recorrido visual máximo de la manija desde el pivote (px lógicos). */
  pullVisualMax: number
  /** Etiqueta corta de la modalidad de control. */
  label: string
  /** Explicación breve para el jugador. */
  dragHint: string
}

export const MODE_CONTROL: Record<Mode, ModeControlProfile> = {
  road: {
    pullMin: 11,
    pullMax: 58,
    minAngle: 10,
    maxAngle: 80,
    angleLocked: null,
    smoothing: 0.78,
    pullVisualMax: 34,
    label: 'Tirachinas ágil 2D',
    dragHint: 'Arrastra hacia atrás y abajo en cualquier ángulo (10°–80°); alcance limitado.',
  },
  rail: {
    pullMin: 12,
    pullMax: 68,
    minAngle: 45,
    maxAngle: 45,
    angleLocked: 45,
    smoothing: 0.65,
    pullVisualMax: 38,
    label: 'Impulsor sobre riel 45°',
    dragHint: 'El ángulo está bloqueado en el riel a 45°: arrastra hacia atrás para graduar la tracción.',
  },
  ship: {
    pullMin: 14,
    pullMax: 78,
    minAngle: 18,
    maxAngle: 72,
    angleLocked: null,
    smoothing: 0.28,
    pullVisualMax: 40,
    label: 'Tensión pesada con inercia',
    dragHint: 'Jalón largo y pesado (18°–72°): responde con inercia, lanza 9 cajas dispersas y vuela lento.',
  },
  plane: {
    pullMin: 10,
    pullMax: 42,
    minAngle: 12,
    maxAngle: 68,
    angleLocked: null,
    smoothing: 1,
    pullVisualMax: 28,
    label: 'Empuje rápido (alta emisión)',
    dragHint: 'Tirón corto y hipersensible (12°–68°): llega muy rápido, pero dispara las emisiones.',
  },
}

export const LAUNCHER_HIT = {
  offsetX: -4,
  offsetY: -8,
  mouseRadius: 48,
  touchRadius: 60,
  tipMouseRadius: 26,
  tipTouchRadius: 36,
} as const

export interface DragEvaluation {
  /** True si el arrastre supera el umbral mínimo para lanzar al soltar. */
  armed: boolean
  /** Ángulo resultante respetando las restricciones del modo. */
  angle: number
  /** Potencia normalizada en [MIN_POWER, 1] cuando armed es true. */
  power: number
  /** Tensión normalizada en [0, 1] dentro del rango de arrastre. */
  tension: number
  /** Distancia efectiva de tiro en px lógicos. */
  pullDist: number
  /** True si llegó al tope máximo de fuerza del transporte. */
  atMax: boolean
  /** True en modos con guía fija cuando el jugador se desvía mucho del eje. */
  offAxisWarning: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Comprueba si el puntero está sobre el vehículo lanzador o la punta del brazo. */
export function isInLauncherZone(
  lx: number,
  ly: number,
  ox: number,
  oy: number,
  armAngleDeg: number,
  power: number,
  isTouch = false,
): boolean {
  const cx = ox + LAUNCHER_HIT.offsetX
  const cy = oy + LAUNCHER_HIT.offsetY
  const bodyRadius = isTouch ? LAUNCHER_HIT.touchRadius : LAUNCHER_HIT.mouseRadius
  if (Math.hypot(lx - cx, ly - cy) <= bodyRadius) return true

  const rad = (armAngleDeg * Math.PI) / 180
  const armLen = 22 + clamp(power, 0, 1) * 6
  const tipX = ox + Math.cos(rad) * armLen
  const tipY = oy - Math.sin(rad) * armLen
  const tipRadius = isTouch ? LAUNCHER_HIT.tipTouchRadius : LAUNCHER_HIT.tipMouseRadius
  return Math.hypot(lx - tipX, ly - tipY) <= tipRadius
}

/** Evalúa un arrastre relativo al punto de agarre según las reglas físicas del transporte. */
export function evaluateDrag(
  mode: Mode,
  start: Point,
  current: Point,
  fallbackAngle: number,
  fallbackPower = 0.7,
): DragEvaluation {
  const profile = MODE_CONTROL[mode]
  const dx = start.x - current.x
  const dy = current.y - start.y

  if (profile.angleLocked !== null) {
    const along = dx * Math.SQRT1_2 + dy * Math.SQRT1_2
    const offAxis = Math.abs(-dx * Math.SQRT1_2 + dy * Math.SQRT1_2)
    if (along < profile.pullMin) {
      return {
        armed: false,
        angle: profile.angleLocked,
        power: clamp(fallbackPower, MIN_POWER, 1),
        tension: 0,
        pullDist: Math.max(0, along),
        atMax: false,
        offAxisWarning: false,
      }
    }
    const tension = clamp((along - profile.pullMin) / (profile.pullMax - profile.pullMin), 0, 1)
    const power = Math.round((MIN_POWER + (1 - MIN_POWER) * tension) * 100) / 100
    return {
      armed: true,
      angle: profile.angleLocked,
      power,
      tension,
      pullDist: along,
      atMax: along >= profile.pullMax,
      offAxisWarning: offAxis > 18,
    }
  }

  const dist = Math.hypot(dx, dy)
  const pulledForward = dx <= -6
  if (pulledForward || dist < profile.pullMin) {
    return {
      armed: false,
      angle: clamp(Math.round(fallbackAngle), profile.minAngle, profile.maxAngle),
      power: clamp(fallbackPower, MIN_POWER, 1),
      tension: 0,
      pullDist: pulledForward ? 0 : dist,
      atMax: false,
      offAxisWarning: false,
    }
  }

  const rawAngle = (Math.atan2(dy, Math.max(0.001, dx)) * 180) / Math.PI
  const angle = Math.round(clamp(rawAngle, profile.minAngle, profile.maxAngle))
  const tension = clamp((dist - profile.pullMin) / (profile.pullMax - profile.pullMin), 0, 1)
  const power = Math.round((MIN_POWER + (1 - MIN_POWER) * tension) * 100) / 100

  return {
    armed: true,
    angle,
    power,
    tension,
    pullDist: dist,
    atMax: dist >= profile.pullMax,
    offAxisWarning: false,
  }
}

/** Calcula la posición visual del manubrio/proyectil manteniéndolo alineado y dentro del escenario. */
export function handlePos(
  ox: number,
  oy: number,
  mode: Mode,
  angle: number,
  tension: number,
  worldW = 640,
  worldH = 360,
): Point {
  const profile = MODE_CONTROL[mode]
  const rad = (effectiveAngle(mode, angle) * Math.PI) / 180
  const ux = -Math.cos(rad)
  const uy = Math.sin(rad)
  const desired = 10 + clamp(tension, 0, 1) * (profile.pullVisualMax - 10)

  const minX = 12, maxX = worldW - 12
  const minY = 16, maxY = worldH - 12
  let maxStep = desired
  if (ux < -1e-6) maxStep = Math.min(maxStep, (minX - ox) / ux)
  else if (ux > 1e-6) maxStep = Math.min(maxStep, (maxX - ox) / ux)
  if (uy > 1e-6) maxStep = Math.min(maxStep, (maxY - oy) / uy)
  else if (uy < -1e-6) maxStep = Math.min(maxStep, (minY - oy) / uy)

  const d = Math.max(6, maxStep)
  return { x: ox + ux * d, y: oy + uy * d }
}

/** Suaviza ángulo y potencia según la inercia del modo (para el barco pesado). */
export function stepSmoothedAim(
  current: { angle: number; power: number },
  target: { angle: number; power: number },
  mode: Mode,
  dt: number,
  reduceMotion: boolean,
): { angle: number; power: number } {
  const profile = MODE_CONTROL[mode]
  const fixedAngle = MODES[mode].fixedAngle
  if (reduceMotion || profile.smoothing >= 1) {
    return {
      angle: fixedAngle ?? clamp(Math.round(target.angle), profile.minAngle, profile.maxAngle),
      power: clamp(target.power, MIN_POWER, 1),
    }
  }
  // Convierte el factor de suavizado [0,1] a una constante de relajación independiente del FPS.
  const rate = 4 + profile.smoothing * 22
  const alpha = 1 - Math.exp(-rate * Math.max(0, dt))
  const rawAngle = current.angle + (target.angle - current.angle) * alpha
  const rawPower = current.power + (target.power - current.power) * alpha
  const angle = fixedAngle ?? clamp(Math.round(rawAngle), profile.minAngle, profile.maxAngle)
  const power = Math.round(clamp(rawPower, MIN_POWER, 1) * 100) / 100
  return { angle, power }
}
