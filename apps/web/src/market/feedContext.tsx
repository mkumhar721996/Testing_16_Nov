import { createContext, useContext, type ReactNode } from 'react'
import type { MarketFeed } from './marketFeed'
import { createSampleFeed } from './sampleFeed'

const FeedContext = createContext<MarketFeed>(createSampleFeed())

export function FeedProvider({ feed, children }: { feed: MarketFeed; children: ReactNode }) {
  return <FeedContext.Provider value={feed}>{children}</FeedContext.Provider>
}

export function useMarketFeed(): MarketFeed {
  return useContext(FeedContext)
}
