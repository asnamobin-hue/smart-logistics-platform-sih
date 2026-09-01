import { useState, useEffect, useCallback } from 'react'

// Generic data-fetching hook — wraps any api.js function, e.g.:
// const { data, loading, error, refetch } = useFetch(getRoutes)
export function useFetch(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFn()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Something went wrong'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    let active = true
    load()
    return () => { active = false }
  }, [load])

  return { data, loading, error, refetch: load }
}