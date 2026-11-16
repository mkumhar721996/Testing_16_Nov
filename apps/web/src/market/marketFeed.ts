export type Period = '1D' | '1W' | '1M' | '1Y'
export type IndexId = 'nifty50' | 'sensex' | 'niftybank'

export interface IndexSeries {
  id: IndexId
  name: string
  /** Latest value (last close outside market hours). */
  value: number
  /** Oldest to newest for the period; the first point is the baseline. */
  points: number[]
}

export interface MarketFeed {
  getIndices(period: Period): Promise<IndexSeries[]>
}
