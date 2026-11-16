import { createSampleFeed } from './sampleFeed'

describe('sampleFeed', () => {
  afterEach(() => vi.useRealTimers())

  it('returns the three indices for every period', async () => {
    const feed = createSampleFeed()
    for (const p of ['1D', '1W', '1M', '1Y'] as const) {
      const r = await feed.getIndices(p)
      expect(r.map((i) => i.id)).toEqual(['nifty50', 'sensex', 'niftybank'])
    }
  })
  it('returns identical data on successive calls (AC11)', async () => {
    const feed = createSampleFeed()
    expect(await feed.getIndices('1D')).toEqual(await feed.getIndices('1D'))
  })
  it('returns the same last-close values regardless of the clock (AC12)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T21:30:00Z'))
    const closed = await createSampleFeed().getIndices('1D')
    vi.setSystemTime(new Date('2026-11-16T06:30:00Z'))
    expect(await createSampleFeed().getIndices('1D')).toEqual(closed)
  })
})
