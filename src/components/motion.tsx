import { animate, m, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { srcSetFor } from '@/data/images'
import { EASE_CALM } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Subtle fade-up when the element scrolls into view */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE_CALM, delay }}
    >
      {children}
    </m.div>
  )
}

/** Number that counts up once when visible */
export function CountUp({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number
  from?: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (!inView) return
    // reduced motion: jump straight to the final number
    const controls = animate(from, to, { duration: reduce ? 0 : duration, ease: EASE_CALM, onUpdate: setValue })
    return () => controls.stop()
  }, [inView, reduce, from, to, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Image that drifts vertically as the page scrolls */
export function ParallaxImage({
  src,
  alt,
  strength = 60,
  className,
  imgClassName,
  eager = false,
  sizes = '100vw',
}: {
  src: string
  alt: string
  /** responsive sizes hint for the generated srcset */
  sizes?: string
  /** max px offset in each direction */
  strength?: number
  className?: string
  imgClassName?: string
  eager?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-strength, strength])

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <m.img
        src={src}
        srcSet={srcSetFor(src)}
        sizes={sizes}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ y, top: -strength, height: `calc(100% + ${strength * 2}px)` }}
        className={cn('absolute inset-x-0 w-full object-cover', imgClassName)}
      />
    </div>
  )
}
