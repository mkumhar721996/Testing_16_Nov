import type { IndexId, IndexSeries, MarketFeed, Period } from './marketFeed'

// Fixed last-close snapshot: deterministic, independent of the clock (market hours).
const INDICES: { id: IndexId; name: string; value: number; starts: Record<Period, number[]> }[] = [
  {
    id: 'nifty50',
    name: 'Nifty 50',
    value: 22150.4,
    starts: {
      '1D': [22080, 22040, 22110, 22095, 22150.4],
      '1W': [21890, 21960, 22010, 22070, 22150.4],
      '1M': [21400, 21700, 21650, 21950, 22150.4],
      '1Y': [19200, 20400, 20900, 21500, 22150.4],
    },
  },
  {
    id: 'sensex',
    name: 'Sensex',
    value: 73100.25,
    starts: {
      '1D': [72900, 72850, 73020, 73050, 73100.25],
      '1W': [72300, 72500, 72750, 72900, 73100.25],
      '1M': [70800, 71900, 71600, 72600, 73100.25],
      '1Y': [63500, 67000, 69000, 71000, 73100.25],
    },
  },
  {
    id: 'niftybank',
    name: 'Nifty Bank',
    value: 47320.8,
    starts: {
      '1D': [47400, 47250, 47180, 47300, 47320.8],
      '1W': [46800, 47000, 47150, 47280, 47320.8],
      '1M': [46200, 46900, 46500, 47100, 47320.8],
      '1Y': [42000, 43500, 45000, 46500, 47320.8],
    },
  },
]

export function createSampleFeed(): MarketFeed {
  return {
    async getIndices(period: Period): Promise<IndexSeries[]> {
      return INDICES.map((i) => ({
        id: i.id,
        name: i.name,
        value: i.value,
        points: [...i.starts[period]],
      }))
    },
  }
}
