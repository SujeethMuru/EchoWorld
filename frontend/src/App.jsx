import { useRef, useState } from 'react'

const mockResult = {
  scene: 'Indoor hallway',
  hazards: [{ name: 'Backpack', position: 'center' }],
  objects: [
    { name: 'Chair', position: 'left' },
    { name: 'Door', position: 'right' },
  ],
  text_detected: ['EXIT'],
  spoken_description: 'A backpack is ahead. A chair is on the left, and a doorway is visible on the right.',
}

const directionLabel = (position) => ({ left: 'Left', right: 'Right', center: 'Ahead' }[position] || position)
const directionArrow = (position) => ({ left: '←', right: '→', center: '↑' }[position] || '•')
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export default function App() {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function selectFile(event) {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setResult(null)
    setError('')
  }

  async function analyze() {
    if (!file) {
      setError('Take or choose a photo first.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to analyze the image.')

      setResult({
        scene: payload.sceneSummary,
        hazards: payload.objects
          .filter((item) => item.priority === 'high')
          .map((item) => ({ name: item.name, position: item.direction })),
        objects: payload.objects.map((item) => ({ name: item.name, position: item.direction })),
        text_detected: [],
        spoken_description: payload.narration,
      })
    } catch (requestError) {
      setError(requestError.message || 'Unable to analyze the image.')
    } finally {
      setLoading(false)
    }
  }

  function speak() {
    if (!result?.spoken_description) return
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(result.spoken_description))
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="phone-shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true"><span className="logo-wave">◖</span></span>
          <div><h1>EchoWorld</h1><p>Hear what’s around you</p></div>
        </div>
        <span className="prototype-pill">PROTOTYPE</span>
      </header>

      <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={selectFile} aria-label="Take or choose a scene photo" />

      {!result && (
        <section className="capture-screen">
          <div className={`camera-frame ${preview ? 'has-photo' : ''}`}>
            {preview ? (
              <img src={preview} alt="Scene selected for analysis" className="camera-preview" />
            ) : (
              <div className="camera-empty">
                <div className="viewfinder" aria-hidden="true"><span /><span /><span /><span /></div>
                <div className="camera-symbol" aria-hidden="true">◎</div>
                <h2>Point toward the space ahead</h2>
                <p>Take one clear photo and EchoWorld will describe the most important things around you.</p>
              </div>
            )}
            {preview && <button className="change-photo" onClick={() => inputRef.current?.click()}>Retake</button>}
          </div>

          {!preview ? (
            <button className="camera-button" onClick={() => inputRef.current?.click()} aria-label="Open camera or choose photo">
              <span className="camera-button-icon" aria-hidden="true">●</span>
              <span><strong>Take a Photo</strong><small>Camera or photo library</small></span>
            </button>
          ) : (
            <button className="analyze-button" onClick={analyze} disabled={loading}>
              <span aria-hidden="true">{loading ? '◌' : '✦'}</span>
              <span><strong>{loading ? 'Analyzing scene…' : 'Analyze Scene'}</strong><small>{loading ? 'Finding useful details' : 'Get an audio description'}</small></span>
            </button>
          )}

          {error && <p className="error" role="alert">{error}</p>}
          <div className="tip"><span aria-hidden="true">◉</span><p><strong>For best results</strong><br />Hold your phone steady and keep the path ahead visible.</p></div>
        </section>
      )}

      {result && (
        <section className="results-screen" aria-live="polite">
          <div className="result-topline"><div><p className="overline">SCENE ANALYZED</p><h2>{result.scene}</h2></div><button className="new-scan" onClick={reset}>New photo</button></div>

          <button className="voice-card" onClick={speak} aria-label="Play scene description">
            <span className="voice-circle" aria-hidden="true">▶</span>
            <span className="voice-copy"><small>AUDIO DESCRIPTION</small><strong>{result.spoken_description}</strong><em>Tap to hear again</em></span>
          </button>

          {result.hazards.length > 0 && <div className="hazard-card"><div className="card-title"><span aria-hidden="true">!</span><strong>Pay attention</strong></div>{result.hazards.map((item) => <div className="object-row" key={`${item.name}-${item.position}`}><span><strong>{item.name}</strong><small>Potential obstacle</small></span><b>{directionArrow(item.position)} {directionLabel(item.position)}</b></div>)}</div>}

          <div className="objects-card"><div className="card-title"><span aria-hidden="true">◇</span><strong>Nearby objects</strong></div>{result.objects.map((item) => <div className="object-row" key={`${item.name}-${item.position}`}><span><strong>{item.name}</strong><small>Detected object</small></span><b>{directionArrow(item.position)} {directionLabel(item.position)}</b></div>)}</div>

          {result.text_detected.length > 0 && <div className="text-card"><div className="card-title"><span aria-hidden="true">T</span><strong>Visible text</strong></div><div className="detected-text">{result.text_detected.join(' · ')}</div></div>}
        </section>
      )}

      <footer><span aria-hidden="true">ⓘ</span><p><strong>Use alongside your mobility aids.</strong> EchoWorld is an experimental prototype and can miss or misidentify objects.</p></footer>
    </main>
  )
}
