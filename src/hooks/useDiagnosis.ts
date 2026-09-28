import { useCallback, useEffect, useRef, useState } from 'react'

export type DiagnosisPhase = 'idle' | 'analyzing' | 'done' | 'error'

/**
 * Photo → on-device model flow shared by Crop Doctor and Pest Watch.
 * Manages the preview object URL, phase and result/error.
 */
export function useDiagnosis<T>(run: (file: File) => Promise<T>) {
  const [phase, setPhase] = useState<DiagnosisPhase>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const urlRef = useRef<string | null>(null)
  const fileRef = useRef<File | null>(null)
  const runId = useRef(0)

  const setUrl = (url: string | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    setPreview(url)
  }

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  const analyze = useCallback(
    async (file: File) => {
      const id = ++runId.current
      setPhase('analyzing')
      setResult(null)
      setError(null)
      try {
        const r = await run(file)
        if (id !== runId.current) return
        setResult(r)
        setPhase('done')
      } catch (e) {
        if (id !== runId.current) return
        setError(e instanceof Error ? e : new Error(String(e)))
        setPhase('error')
      }
    },
    [run],
  )

  const start = useCallback(
    (file: File) => {
      fileRef.current = file
      setUrl(URL.createObjectURL(file))
      void analyze(file)
    },
    [analyze],
  )

  const retry = useCallback(() => {
    if (fileRef.current) void analyze(fileRef.current)
  }, [analyze])

  const reset = useCallback(() => {
    runId.current++
    fileRef.current = null
    setUrl(null)
    setResult(null)
    setError(null)
    setPhase('idle')
  }, [])

  return { phase, preview, result, error, start, retry, reset }
}
