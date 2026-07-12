export type ThemePreference = 'system' | 'dark' | 'light'

export type AppPreferences = {
  theme: ThemePreference
  reduceMotion: boolean
  compactMode: boolean
}

const STORAGE_KEY = 'capsuledex.preferences.v1'

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  reduceMotion: false,
  compactMode: false,
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system'
        ? parsed.theme
        : DEFAULT_PREFERENCES.theme,
      reduceMotion: Boolean(parsed.reduceMotion),
      compactMode: Boolean(parsed.compactMode),
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(preferences: AppPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // L'app resta utilizzabile anche se il browser impedisce il salvataggio locale.
  }
}

export function resolveTheme(theme: ThemePreference): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') return theme
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyPreferences(preferences: AppPreferences) {
  const root = document.documentElement
  const resolvedTheme = resolveTheme(preferences.theme)
  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = preferences.theme
  root.classList.toggle('reduce-motion', preferences.reduceMotion)
  root.classList.toggle('compact-mode', preferences.compactMode)
  root.style.colorScheme = resolvedTheme

  const themeColor = resolvedTheme === 'light' ? '#eef5fa' : '#071523'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
}
