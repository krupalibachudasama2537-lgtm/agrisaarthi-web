import { Camera, ImagePlus, Upload } from 'lucide-react'
import { type DragEvent, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_BYTES = 10 * 1024 * 1024

interface PhotoUploadProps {
  title: string
  onSelect: (file: File) => void
  disabled?: boolean
  className?: string
}

/** Drag & drop / file picker / phone camera for leaf and pest photos */
export function PhotoUpload({ title, onSelect, disabled, className }: PhotoUploadProps) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hintId = useId()

  const accept = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError(t('dash.doctor.invalidType'))
    if (file.size > MAX_BYTES) return setError(t('dash.doctor.tooLarge'))
    setError(null)
    onSelect(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) accept(e.dataTransfer.files[0])
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-describedby={hintId}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-brand bg-brand-soft' : 'border-surface-line bg-surface/60',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-sm">
          <ImagePlus className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold">{title}</p>
        <p id={hintId} className="mt-1 text-xs text-ink/60">
          {t('dash.doctor.uploadHint')}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button type="button" size="sm" shape="rounded" className="bg-brand hover:bg-brand-dark" onClick={() => cameraRef.current?.click()} disabled={disabled}>
            <Camera />
            {t('dash.doctor.camera')}
          </Button>
          <Button type="button" size="sm" variant="outline" shape="rounded" onClick={() => fileRef.current?.click()} disabled={disabled}>
            <Upload />
            {t('dash.doctor.choose')}
          </Button>
        </div>
        <p className="mt-3 text-caption text-ink/60">{t('dash.doctor.formats')}</p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-crit-soft px-3 py-1.5 text-xs font-medium text-crit">
            {error}
          </p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
