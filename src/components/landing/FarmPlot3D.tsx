import { m, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IMAGES, srcSetFor } from '@/data/images'
import { cn } from '@/lib/utils'

/** Sensor poles standing on the plot (percent coords on the top face) */
const PINS = [
  { x: 30, y: 30, station: true },
  { x: 72, y: 26 },
  { x: 24, y: 74 },
  { x: 68, y: 70 },
]

/**
 * Isometric "3D" farm plot built with CSS transforms:
 * a textured top face (aerial crop rows) with soil-strata side faces,
 * sensor poles, a highlighted dry zone and a soft ground shadow.
 */
export function FarmPlot3D({ className }: { className?: string }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()

  return (
    <div
      className={cn(
        'relative grid place-items-center [--plot:230px] [--depth:34px] sm:[--plot:300px] sm:[--depth:42px] lg:[--plot:340px] lg:[--depth:48px]',
        className,
      )}
      style={{ perspective: '1600px' }}
    >
      {/* ground shadow */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[62%] h-[calc(var(--plot)*0.5)] w-[calc(var(--plot)*1.5)] -translate-x-1/2 rounded-[50%] bg-ink/25 blur-2xl"
      />

      <m.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
      >
        <div
          role="img"
          aria-label={t('hero.plotLabel')}
          className="relative size-[var(--plot)]"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(58deg) rotateZ(-38deg)' }}
        >
          {/* top face */}
          <div className="absolute inset-0 overflow-hidden rounded-md bg-olive">
            <img
              src={IMAGES.plotTop}
              srcSet={srcSetFor(IMAGES.plotTop, 1080)}
              sizes="(min-width: 1024px) 420px, 320px"
              alt=""
              loading="eager"
              decoding="async"
              className="size-full scale-125 object-cover saturate-[1.15]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-ink/20" />
            {/* 3x3 zone grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'border border-white/25',
                    i === 5 && 'border-alert/80 bg-alert/35',
                  )}
                />
              ))}
            </div>
          </div>

          {/* front (bottom edge) face */}
          <div
            className="soil-strata absolute left-0 top-full h-[var(--depth)] w-full rounded-b-[4px]"
            style={{ transformOrigin: 'top', transform: 'rotateX(-90deg)' }}
          />
          {/* left face */}
          <div
            className="absolute right-full top-0 h-full w-[var(--depth)] brightness-75"
            style={{
              transformOrigin: 'right',
              transform: 'rotateY(-90deg)',
              background:
                'linear-gradient(to left, #6f8a3a 0, #6f8a3a 6%, #5a3e2b 6%, #4a3222 38%, #6b4c35 38%, #5b4130 64%, #3b271a 64%, #2a1c12 100%)',
            }}
          />

          {/* sensor poles */}
          {PINS.map((pin) => (
            <div
              key={`${pin.x}-${pin.y}`}
              className="absolute"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transformStyle: 'preserve-3d' }}
            >
              <span className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-lime/90" />
              <span className="absolute -left-1.5 -top-1.5 size-3 animate-soft-pulse rounded-full bg-lime/70" />
              <div
                className="absolute bottom-0 left-[-1px] w-[2px] bg-gradient-to-t from-white/60 to-white"
                style={{
                  height: pin.station ? 'calc(var(--plot) * 0.26)' : 'calc(var(--plot) * 0.13)',
                  transformOrigin: 'bottom',
                  transform: 'rotateX(-90deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {pin.station ? (
                  <span className="absolute -left-[13px] -top-[6px] h-[10px] w-[28px] rounded-sm border border-white/70 bg-gradient-to-br from-sky-700 to-slate-900" />
                ) : (
                  <span className="absolute -left-[3px] -top-[4px] size-2 rounded-full bg-white shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      </m.div>

      {/* dry-zone label (2D, positioned over the highlighted cell) */}
      <span className="pointer-events-none absolute left-[62%] top-[46%] rounded-md bg-alert px-1.5 py-0.5 text-2xs font-semibold text-white shadow sm:left-[63%]">
        {t('hero.dryZone')}
      </span>
    </div>
  )
}
