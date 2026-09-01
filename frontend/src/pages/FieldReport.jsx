import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, UploadCloud, CheckCircle } from 'lucide-react'
import { createFieldReport } from '../services/api.js'
import { INCIDENT_TYPES, OFFLINE_QUEUE_KEY } from '../utils/constants.js'

// --- Offline queue helpers (requirement h: offline data sync for low-network areas) ---
// Photos are stored as base64 in localStorage while queued, then converted back
// to a File/Blob for upload once the device is back online.
function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}
function writeQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
function base64ToFile(base64, filename, mime) {
  const arr = base64.split(',')
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}

const initialForm = {
  reporterName: '',
  reporterRole: 'field_officer',
  incidentType: 'landslide',
  severity: 'medium',
  description: '',
  lat: '',
  lon: ''
}

export default function FieldReport() {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(initialForm)
  const [photo, setPhoto] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null) // 'synced' | 'queued'
  const [queueCount, setQueueCount] = useState(readQueue().length)
  const fileInputRef = useRef(null)

  // Attempt to flush the offline queue whenever we come back online
  useEffect(() => {
    const flush = () => flushQueue()
    window.addEventListener('online', flush)
    flush() // also try on mount in case we're already online with a backlog
    return () => window.removeEventListener('online', flush)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function flushQueue() {
    if (!navigator.onLine) return
    const queue = readQueue()
    if (queue.length === 0) return

    const remaining = []
    for (const item of queue) {
      try {
        const fd = buildFormData(item, item.photoBase64 ? base64ToFile(item.photoBase64, item.photoName, item.photoType) : null)
        await createFieldReport(fd)
      } catch {
        remaining.push(item) // keep it queued and retry later
      }
    }
    writeQueue(remaining)
    setQueueCount(remaining.length)
  }

  function buildFormData(data, photoFile) {
    const fd = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (['photoBase64', 'photoName', 'photoType'].includes(key)) return
      if (value !== undefined && value !== null) fd.append(key, value)
    })
    if (photoFile) fd.append('photo', photoFile)
    return fd
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lon: pos.coords.longitude.toFixed(6) }))
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitted(null)

    const payload = {
      ...form,
      language: i18n.language,
      clientCreatedAt: new Date().toISOString()
    }

    if (navigator.onLine) {
      try {
        const fd = buildFormData({ ...payload, synced: 'true' }, photo)
        await createFieldReport(fd)
        setSubmitted('synced')
        resetForm()
      } catch {
        // Even an online submit can fail (flaky connectivity) — fall back to queueing
        await queueReport(payload)
        setSubmitted('queued')
        resetForm()
      }
    } else {
      await queueReport(payload)
      setSubmitted('queued')
      resetForm()
    }
    setSubmitting(false)
  }

  async function queueReport(payload) {
    const queue = readQueue()
    const item = { ...payload, synced: 'false' }
    if (photo) {
      item.photoBase64 = await fileToBase64(photo)
      item.photoName = photo.name
      item.photoType = photo.type
    }
    queue.push(item)
    writeQueue(queue)
    setQueueCount(queue.length)
  }

  function resetForm() {
    setForm(initialForm)
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{t('fieldReport.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{t('fieldReport.subtitle')}</p>

      {!navigator.onLine && (
        <div className="card" style={{ marginBottom: '16px', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}>
          {t('fieldReport.offlineNotice')}
        </div>
      )}

      {queueCount > 0 && (
        <div className="card" style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {t('fieldReport.queuedCount', { count: queueCount })}
        </div>
      )}

      {submitted && (
        <div className="card" style={{
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          color: submitted === 'synced' ? 'var(--color-success)' : 'var(--color-warning)'
        }}>
          <CheckCircle size={18} />
          {submitted === 'synced' ? 'Report submitted and synced.' : 'Report saved locally — will sync automatically.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
        <label style={{ fontSize: '13px' }}>
          {t('fieldReport.reporterName')}
          <input
            required
            value={form.reporterName}
            onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))}
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: '13px' }}>
          {t('fieldReport.reporterRole')}
          <select
            value={form.reporterRole}
            onChange={(e) => setForm((f) => ({ ...f, reporterRole: e.target.value }))}
            style={inputStyle}
          >
            <option value="field_officer">Field Officer</option>
            <option value="local_authority">Local Authority</option>
            <option value="district_admin">District Admin</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label style={{ fontSize: '13px' }}>
          {t('fieldReport.incidentType')}
          <select
            value={form.incidentType}
            onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value }))}
            style={inputStyle}
          >
            {INCIDENT_TYPES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '13px' }}>
          Severity
          <select
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>

        <label style={{ fontSize: '13px' }}>
          {t('fieldReport.description')}
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ fontSize: '13px', flex: 1 }}>
            Latitude
            <input required type="number" step="any" value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} style={inputStyle} />
          </label>
          <label style={{ fontSize: '13px', flex: 1 }}>
            Longitude
            <input required type="number" step="any" value={form.lon}
              onChange={(e) => setForm((f) => ({ ...f, lon: e.target.value }))} style={inputStyle} />
          </label>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px', background: 'var(--color-surface-light)', color: 'var(--color-text)'
          }}
        >
          <MapPin size={16} /> {locating ? '...' : t('fieldReport.useMyLocation')}
        </button>

        <label style={{ fontSize: '13px' }}>
          {t('fieldReport.photo')}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            style={{ display: 'block', marginTop: '6px', fontSize: '13px' }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', background: 'var(--color-primary)', color: '#fff', fontWeight: 600
          }}
        >
          <UploadCloud size={16} /> {submitting ? '...' : t('fieldReport.submit')}
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: '6px',
  padding: '9px 10px',
  background: 'var(--color-surface-light)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontSize: '14px'
}
