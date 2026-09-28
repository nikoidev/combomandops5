import { useEffect, useMemo, useState } from 'react'
import { loadSkills } from '../lib/data'
import type { Skill } from '../lib/types'

export function useSkills(slug: string | null) {
  const [loaded, setLoaded] = useState<{ slug: string; skills: Skill[] } | null>(null)

  useEffect(() => {
    if (!slug) return
    let alive = true
    loadSkills(slug).then((skills) => alive && setLoaded({ slug, skills }))
    return () => {
      alive = false
    }
  }, [slug])

  const skills = loaded && loaded.slug === slug ? loaded.skills : null
  const byId = useMemo(() => new Map((skills ?? []).map((s) => [s.id, s])), [skills])
  return { skills, byId, loading: !!slug && !skills }
}
