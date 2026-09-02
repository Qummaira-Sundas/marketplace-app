import { PAGE_SIZE } from "../hooks/useInfiniteScroll";

function InfiniteScrollFooter({
    sentinelRef,
    hasMore,
    visibleCount,
    totalItems,
}) {
    if (totalItems === 0) return null;

    return (
        <div className="infinite-scroll-footer">
            <p className="infinite-scroll-summary">
                Showing {visibleCount} of {totalItems}
            </p>

            {hasMore ? (
                <div ref={sentinelRef} className="infinite-scroll-sentinel">
                    <span className="infinite-scroll-loader">
                        Loading more listings...
                    </span>
                </div>
            ) : totalItems > PAGE_SIZE ? (
                <p className="infinite-scroll-end">You have reached the end</p>
            ) : null}
        </div>
    );
}

export default InfiniteScrollFooter;
