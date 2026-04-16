import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

interface Options {
  hasNextPage: boolean
  isLoading: boolean
  onLoadMore: () => void
}

export function useInfiniteScroll({ hasNextPage, isLoading, onLoadMore }: Options) {
  const { ref, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      onLoadMore()
    }
  }, [inView, hasNextPage, isLoading, onLoadMore])

  return { sentinelRef: ref }
}
