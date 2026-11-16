export type SectionId = 'index' | 'sip' | 'watchlist' | 'ipo'

export const PERIODS = ['1 day', '1 week', '1 month', '1 year'] as const
export type Period = (typeof PERIODS)[number]

export type SectionState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'loaded'; data: T }

export interface SectionSource<T> {
  load(signal: AbortSignal, ctx: { period: Period }): Promise<T>
  isEmpty(data: T): boolean
}
