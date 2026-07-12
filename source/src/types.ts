export type Feature = {
  id: string
  title: string
  subtitle: string
  icon: string
  accent: 'orange' | 'green' | 'purple' | 'blue' | 'cyan' | 'pink'
  phase: number
  wide?: boolean
}
