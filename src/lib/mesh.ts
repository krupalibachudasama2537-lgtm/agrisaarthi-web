import type { MeshData } from '@/data/types'

export interface MeshRouting {
  /** node id → parent id on the shortest path to the gateway */
  parent: Map<string, string>
  /** node id → full path to gateway (inclusive), undefined if unreachable */
  path: Map<string, string[]>
  /** "a|b" keys of links carrying traffic */
  active: Set<string>
}

export const linkKey = (a: string, b: string) => [a, b].sort().join('|')

/**
 * Breadth-first routing from the gateway over links whose ends are both online.
 * Mirrors how the Zigbee mesh picks the fewest-hop parent for each station.
 */
export function computeRoutes(mesh: MeshData, offline: Set<string>): MeshRouting {
  const gateway = mesh.nodes.find((n) => n.gateway)
  const parent = new Map<string, string>()
  const path = new Map<string, string[]>()
  const active = new Set<string>()
  if (!gateway || offline.has(gateway.id)) return { parent, path, active }

  const neighbours = new Map<string, string[]>()
  for (const [a, b] of mesh.links) {
    if (offline.has(a) || offline.has(b)) continue
    neighbours.set(a, [...(neighbours.get(a) ?? []), b])
    neighbours.set(b, [...(neighbours.get(b) ?? []), a])
  }

  const queue = [gateway.id]
  const seen = new Set(queue)
  path.set(gateway.id, [gateway.id])
  while (queue.length) {
    const id = queue.shift()!
    for (const next of neighbours.get(id) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      parent.set(next, id)
      path.set(next, [next, ...(path.get(id) ?? [])])
      active.add(linkKey(next, id))
      queue.push(next)
    }
  }
  return { parent, path, active }
}
