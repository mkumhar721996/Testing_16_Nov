import { markStale, takeStale } from './staleSections'

describe('staleSections (AC20)', () => {
  afterEach(() => takeStale())

  it.each([
    ['buy', ['watchlist']],
    ['apply', ['ipo']],
    ['add-stock', ['watchlist']],
    ['start-sip', ['sip']],
  ] as const)('%s marks %j', (action, expected) => {
    markStale(action)
    expect(takeStale()).toEqual(expected)
  })

  it('returns each section once and clears', () => {
    markStale('buy')
    markStale('add-stock')
    markStale('apply')
    expect(takeStale().sort()).toEqual(['ipo', 'watchlist'])
    expect(takeStale()).toEqual([])
  })
})
