import { useRef, useState } from 'react'

const mockResult = {
  scene: 'Indoor hallway',
  hazards: [{ name: 'Backpack', position: 'center' }],
  objects: [
    { name: 'Chair', position: 'left' },
    { name: 'Door', position: 'right' },
  ],
  text_detected: ['EXIT'],
  spoken_description:
    'A backpack is ahead. A chair is on the left, and a doorway is visible on the right.',
}

const directionLabel = (position) =>
  ({ left: 'Left', right: 'Right', center: 'Ahead' }[position] || position)

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
      setError('Choose or take a photo first.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    // Mock response for independent frontend development.
    // Replace this block with fetch(`${API_URL}/analyze`, { method: 'POST', body: formData })
    // when the FastAPI backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 850))
    setResult(mockResult)
    setLoading(false)
  }

  function speak() {
    if (!result?.spoken_description) return
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(result.spoken_description))
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="brand-mark" aria-hidden="true">◉</div>
        <div>
          <p className="eyebrow">ACCESSIBLE SCENE AWARENESS</p>
          <h1>EchoWorld</h1>
          <p className="subtitle">Hear what’s around you from a single photo.</p>
        </div>
      </header>

      <section className="card upload-card" aria-labelledby="photo-heading">
        <div className="section-heading">
          <div>
            <p className="step">STEP 1</p>
            <h2 id="photo-heading">Choose your view</h2>
          </div>
          <span className="status-dot">Ready</span>
        </div>

        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={selectFile}
          aria-label="Choose or take a scene photo"
        />

        {preview ? (
          <div className="preview-wrap">
            <img src={preview} alt="Scene selected for analysis" className="preview" />
            <button className="secondary-button" onClick={() => inputRef.current?.click()}>
              Change photo
            </button>
          </div>
        ) : (
          <button className="drop-zone" onClick={() => inputRef.current?.click()}>
            <span className="camera-icon" aria-hidden="true">▣</span>
            <strong>Take or upload a photo</strong>
            <span>Use a clear image of the space ahead of you.</span>
          </button>
        )}

        <button className="analyze-button" onClick={analyze} disabled={loading}>
          {loading ? <span className="spinner" aria-hidden="true" /> : <span aria-hidden="true">✦</span>}
          {loading ? 'Analyzing scene…' : 'Analyze Scene'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {result && (
        <section className="results" aria-live="polite">
          <div className="section-heading results-heading">
            <div>
              <p className="step">STEP 2</p>
              <h2>What’s around you</h2>
            </div>
            <span className="scene-label">{result.scene}</span>
          </div>

          <div className="spoken-card">
            <span className="sound-icon" aria-hidden="true">)))</span>
            <div>
              <p className="mini-label">SCENE DESCRIPTION</p>
              <p>{result.spoken_description}</p>
            </div>
            <button className="replay" onClick={speak} aria-label="Replay spoken scene description">▶ Replay</button>
          </div>

          {result.hazards.length > 0 && (
            <div className="result-group hazard-group">
              <h3><span aria-hidden="true">⚠</span> Potential hazards</h3>
              {result.hazards.map((item) => (
                <div className="result-row" key={`${item.name}-${item.position}`}>
                  <strong>{item.name}</strong><span>{directionLabel(item.position)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="result-grid">
            <div className="result-group">
              <h3>Objects</h3>
              {result.objects.map((item) => (
                <div className="result-row" key={`${item.name}-${item.position}`}>
                  <strong>{item.name}</strong><span>{directionLabel(item.position)}</span>
                </div>
              ))}
            </div>
            <div className="result-group">
              <h3>Visible text</h3>
              {result.text_detected.length ? result.text_detected.map((text) => (
                <div className="text-chip" key={text}>“{text}”</div>
              )) : <p className="muted">No text detected</p>}
            </div>
          </div>
        </section>
      )}

      <footer>
        <strong>Prototype notice:</strong> EchoWorld can make mistakes and is not a substitute for a cane, guide dog, sighted guide, or other mobility aid.
      </footer>
    </main>
  )
}
