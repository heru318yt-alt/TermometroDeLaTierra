import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioControls } from '../../components/AudioControls'
import { AudioProvider } from './AudioProvider'
import { playSfx } from './sfx'
import { playVictoryFanfare, setVictoryAudioState, stopVictoryFanfare } from './victorySound'

interface MockGainNode {
  gain: {
    value: number
    setValueAtTime: ReturnType<typeof vi.fn>
    setTargetAtTime: ReturnType<typeof vi.fn>
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
    cancelScheduledValues: ReturnType<typeof vi.fn>
  }
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

interface MockOscillatorNode {
  type: OscillatorType
  frequency: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> }
  detune: { value: number }
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
}

interface MockBufferSourceNode {
  buffer: AudioBuffer | null
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
}

let createdOscillators: MockOscillatorNode[] = []
let createdBufferSources: MockBufferSourceNode[] = []
let createdContexts: FakeAudioContext[] = []

class FakeAudioContext {
  state: AudioContextState = 'suspended'
  currentTime = 0
  destination = {} as AudioDestinationNode

  constructor() {
    createdContexts.push(this)
  }

  resume = vi.fn(async () => {
    this.state = 'running'
  })

  close = vi.fn(async () => {
    this.state = 'closed'
  })

  createGain = vi.fn((): MockGainNode => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))

  createBiquadFilter = vi.fn(() => ({
    type: 'lowpass' as BiquadFilterType,
    frequency: { value: 0, setTargetAtTime: vi.fn() },
    Q: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))

  createOscillator = vi.fn((): MockOscillatorNode => {
    const osc: MockOscillatorNode = {
      type: 'sine',
      frequency: {
        value: 0,
        setValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      detune: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
    }
    createdOscillators.push(osc)
    return osc
  })

  createBufferSource = vi.fn((): MockBufferSourceNode => {
    const source: MockBufferSourceNode = {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
    }
    createdBufferSources.push(source)
    return source
  })

  decodeAudioData = vi.fn(async () => ({
    numberOfChannels: 1,
    length: 4,
    sampleRate: 44100,
    duration: 0.1,
    getChannelData: () => new Float32Array([0.2, -0.2, 0.2, -0.2]),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  }))
}

beforeEach(() => {
  createdOscillators = []
  createdBufferSources = []
  createdContexts = []
  window.localStorage.clear()
  setVictoryAudioState(false, false)
  stopVictoryFanfare()

  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false,
    arrayBuffer: async () => new ArrayBuffer(0),
  })))
})

afterEach(() => {
  cleanup()
  stopVictoryFanfare()
  setVictoryAudioState(false, false)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('victorySound · prevención de solapamientos', () => {
  it('no reproduce fanfarria sintetizada cuando AudioProvider está activo', async () => {
    setVictoryAudioState(true, false)
    playVictoryFanfare(true)
    await Promise.resolve()
    expect(createdOscillators).toHaveLength(0)
  })

  it('detiene la fanfarria anterior si se dispara una segunda en modo respaldo', async () => {
    setVictoryAudioState(false, false)
    playVictoryFanfare(false)
    await waitFor(() => expect(createdOscillators.length).toBeGreaterThan(0))
    const firstBatch = [...createdOscillators]

    playVictoryFanfare(true)
    await waitFor(() => expect(createdOscillators.length).toBeGreaterThan(firstBatch.length))
    // Al lanzar la segunda fanfarria, los nodos de la primera deben haberse detenido.
    expect(firstBatch.every(osc => osc.stop.mock.calls.length >= 2)).toBe(true)
  })
})

describe('AudioProvider y AudioControls', () => {
  function renderControls() {
    return render(
      <MemoryRouter>
        <AudioProvider>
          <AudioControls />
          <label>
            <input type="radio" name="test-radio" value="a" />
            Opción A
          </label>
          <select aria-label="Selector de prueba" defaultValue="1">
            <option value="1">Uno</option>
            <option value="2">Dos</option>
          </select>
        </AudioProvider>
      </MemoryRouter>,
    )
  }

  it('activa audio desde estado suspendido y «Probar un efecto» suena y muestra confirmación visual', async () => {
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Sonido:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Activar audio' }))

    await waitFor(() => {
      expect(createdContexts[0]?.resume).toHaveBeenCalled()
    })

    const countBeforeTest = createdOscillators.length
    const testBtn = screen.getByRole('button', { name: 'Probar un efecto' })
    expect((testBtn as HTMLButtonElement).disabled).toBe(false)

    await userEvent.click(testBtn)
    await waitFor(() => {
      expect(createdOscillators.length).toBeGreaterThan(countBeforeTest)
    })
    expect(screen.getByRole('button', { name: 'Reproduciendo efecto…' })).toBeTruthy()
  })

  it('deshabilita «Probar un efecto» cuando el volumen de Efectos está en 0 %', async () => {
    window.localStorage.setItem('tt-effects', '0')
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Sonido:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Activar audio' }))

    const testBtn = screen.getByRole('button', { name: 'Probar un efecto' }) as HTMLButtonElement
    expect(testBtn.disabled).toBe(true)
  })

  it('detiene el efecto anterior del mismo canal para evitar que los sonidos se sobrepongan', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })))

    renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Sonido:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Activar audio' }))

    await waitFor(() => expect(createdContexts[0]?.decodeAudioData).toHaveBeenCalled())
    // Espera un tick para que se guarden los buffers decodificados.
    await act(async () => {
      await Promise.resolve()
    })

    createdBufferSources = []
    act(() => {
      playSfx('adventure')
    })
    await waitFor(() => expect(createdBufferSources).toHaveLength(1))
    const firstSource = createdBufferSources[0]
    expect(firstSource.stop).not.toHaveBeenCalled()

    // Avanzar reloj simulado para superar cooldown y lanzar otro sonido del mismo canal ('fanfare').
    createdContexts[0].currentTime = 0.2
    act(() => {
      playSfx('win')
    })
    await waitFor(() => expect(createdBufferSources).toHaveLength(2))
    expect(firstSource.stop).toHaveBeenCalled()
  })

  it('no dispara doble efecto entre click y change en select ni radio nativo', async () => {
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: /Sonido:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Activar audio' }))
    await waitFor(() => expect(createdContexts[0]?.state).toBe('running'))

    createdContexts[0].currentTime = 1.0
    const beforeRadio = createdOscillators.length
    const radio = screen.getByRole('radio', { name: 'Opción A' })
    await userEvent.click(radio)
    // toggle sintetiza exactamente 2 tonos (una sola vez, no 3 con click extra)
    expect(createdOscillators.length - beforeRadio).toBe(2)

    createdContexts[0].currentTime = 2.0
    const beforeSelect = createdOscillators.length
    const select = screen.getByLabelText('Selector de prueba')
    fireEvent.click(select)
    fireEvent.change(select, { target: { value: '2' } })
    // timeline sintetiza exactamente 1 tono (sin click adicional de select)
    expect(createdOscillators.length - beforeSelect).toBe(1)
  })
})
