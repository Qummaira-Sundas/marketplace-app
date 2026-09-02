import { useEffect, useMemo, useRef, useState } from "react";

export const PAGE_SIZE = 10;

export function useInfiniteScroll(items, pageSize = PAGE_SIZE, resetDeps = []) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const sentinelRef = useRef(null);

    const totalItems = items.length;
    const visibleItems = useMemo(
        () => items.slice(0, visibleCount),
        [items, visibleCount]
    );
    const hasMore = visibleCount < totalItems;

    useEffect(() => {
        setVisibleCount(pageSize);
    }, resetDeps);

    useEffect(() => {
        if (visibleCount > totalItems && totalItems > 0) {
            setVisibleCount(totalItems);
        }
    }, [visibleCount, totalItems]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || !hasMore) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + pageSize, totalItems)
                    );
                }
            },
            { rootMargin: "160px" }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, totalItems, pageSize]);

    return {
        visibleItems,
        sentinelRef,
        hasMore,
        totalItems,
        visibleCount: Math.min(visibleCount, totalItems),
        pageSize,
    };
}

export function useInfiniteScrollTrigger({ hasMore, loading, onLoadMore }) {
    const sentinelRef = useRef(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || !hasMore || loading) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    onLoadMore();
                }
            },
            { rootMargin: "160px" }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore]);

    return sentinelRef;
}
