import type { PokemonTeam } from '../types'

const STORAGE_KEY = 'capsuledex.teams.v1'
const ACTIVE_TEAM_KEY = 'capsuledex.activeTeam.v1'

const starterTeam: PokemonTeam = {
  id: 'starter-team',
  name: 'Squadra Principale',
  pokemonIds: [3, 6, 130, 448, 282, 25],
  createdAt: Date.now(),
}

function isTeam(value: unknown): value is PokemonTeam {
  if (!value || typeof value !== 'object') return false
  const team = value as Partial<PokemonTeam>
  return (
    typeof team.id === 'string' &&
    typeof team.name === 'string' &&
    Array.isArray(team.pokemonIds) &&
    team.pokemonIds.every((id) => Number.isInteger(id) && id > 0) &&
    typeof team.createdAt === 'number'
  )
}

export function loadTeams(): PokemonTeam[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [starterTeam]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [starterTeam]
    const valid = parsed
      .filter(isTeam)
      .map((team) => ({ ...team, name: team.name.trim() || 'Squadra senza nome', pokemonIds: [...new Set(team.pokemonIds)].slice(0, 6) }))
    return valid.length > 0 ? valid : [starterTeam]
  } catch {
    return [starterTeam]
  }
}

export function saveTeams(teams: PokemonTeam[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
  } catch {
    // L'app continua a funzionare anche se Safari blocca lo storage.
  }
}

export function loadActiveTeamId(teams: PokemonTeam[]): string {
  try {
    const stored = window.localStorage.getItem(ACTIVE_TEAM_KEY)
    if (stored && teams.some((team) => team.id === stored)) return stored
  } catch {
    // Ignora e usa la prima squadra.
  }
  return teams[0]?.id ?? ''
}

export function saveActiveTeamId(teamId: string) {
  try {
    window.localStorage.setItem(ACTIVE_TEAM_KEY, teamId)
  } catch {
    // Ignora: la selezione resta valida nella sessione corrente.
  }
}

export function createTeamId() {
  if ('randomUUID' in crypto) return crypto.randomUUID()
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
