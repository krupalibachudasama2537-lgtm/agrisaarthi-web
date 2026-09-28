import { useCallback, useEffect, useState } from 'react'

type Key = string | number | boolean | null | undefined

interface ApiState<T> {
  key: string | null
  data: T | null
  error: Error | null
}

/**
 * Minimal async loader for src/lib/api.ts calls.
 *
 *   const { data, error, loading, reload, mutate } = useApi(() => api.getSoil(farmId), [farmId])
 *
 * - re-fetches whenever a value in `deps` changes (or `reload()` is called)
 * - `loading` is derived, so the previous request's data is never shown for new deps
 * - `mutate` lets a page apply optimistic updates (e.g. pump toggle)
 * Swap for TanStack Query later if caching/background refetch is needed.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: Key[] = []) {
  const [token, setToken] = useState(0)
  const key = JSON.stringify([...deps, token])
  const [state, setState] = useState<ApiState<T>>({ key: null, data: null, error: null })

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ key, data: null, error: err instanceof Error ? err : new Error(String(err)) })
      })
    return () => {
      cancelled = true
    }
    // `key` captures deps + reload token; fetcher is read fresh each time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setToken((t) => t + 1), [])
  const mutate = useCallback((updater: (prev: T) => T) => {
    setState((s) => (s.data === null ? s : { ...s, data: updater(s.data) }))
  }, [])

  const loading = state.key !== key
  return {
    data: loading ? null : state.data,
    error: loading ? null : state.error,
    loading,
    reload,
    mutate,
  }
}
