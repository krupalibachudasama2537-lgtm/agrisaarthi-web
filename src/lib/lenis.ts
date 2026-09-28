import type Lenis from 'lenis'

/** Module-level handle so any component can drive smooth scrolling */
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null) {
  instance = lenis
}

export function getLenis() {
  return instance
}

/** Smooth-scroll to a section id */
export function scrollToId(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (instance) {
    instance.scrollTo(target, { offset: -8, duration: 1.4 })
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
