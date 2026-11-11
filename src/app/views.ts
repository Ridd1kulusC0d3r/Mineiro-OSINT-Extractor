// The views the main canvas can show. `dashboard` is the legacy DashboardView (no tab; see src/app/shortcuts.ts);
// `profile` is the old name of the AI workspace and renders the same screen as `ai`.
export type AppView =
  | 'intelligence'
  | 'dashboard'
  | 'grid'
  | 'table'
  | 'profile'
  | 'ai'
  | 'linkage'
  | 'terminal'
  | 'batch';
