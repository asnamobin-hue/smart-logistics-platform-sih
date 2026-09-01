// Shared formatting helpers used across pages/components

export const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export const formatDistance = (km) => {
  if (km == null) return '—'
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export const formatDuration = (minutes) => {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''