import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiPackage, FiSearch } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { useToast } from "../context/ToastContext";
import { useUserLists } from "../context/UserListsContext";
import {
    PAGE_SIZE,
    useInfiniteScrollTrigger,
} from "../hooks/useInfiniteScroll";
import InfiniteScrollFooter from "../components/InfiniteScrollFooter";

const API_BASE = "http://localhost:5000/api/posts";

function Marketplace() {
    const { showToast } = useToast();
    const { hiddenIds } = useUserLists();
    const location = useLocation();

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);

    const requestIdRef = useRef(0);

    const buildQueryString = useCallback(
        (pageNumber) => {
            const params = new URLSearchParams({
                page: String(pageNumber),
                limit: String(PAGE_SIZE),
                sort: sortBy,
            });

            const query = search.trim();
            if (query) {
                params.set("q", query);
            }

            if (hiddenIds.length) {
                params.set("hidden", hiddenIds.join(","));
            }

            return params.toString();
        },
        [search, sortBy, hiddenIds]
    );

    const fetchPostsPage = useCallback(
        async (pageNumber, { append = false } = {}) => {
            const requestId = ++requestIdRef.current;

            const response = await fetch(
                `${API_BASE}?${buildQueryString(pageNumber)}`
            );
            const data = await response.json();

            if (requestId !== requestIdRef.current) {
                return null;
            }

            if (!response.ok) {
                throw new Error(data.message || "Failed to load listings");
            }

            const nextPosts = Array.isArray(data.posts) ? data.posts : [];

            setPosts((prev) =>
                append ? [...prev, ...nextPosts] : nextPosts
            );
            setPage(data.page ?? pageNumber);
            setTotal(data.total ?? nextPosts.length);
            setHasMore(Boolean(data.hasMore));

            return data;
        },
        [buildQueryString]
    );

    useEffect(() => {
        let cancelled = false;

        const loadFirstPage = async () => {
            setLoading(true);
            setPosts([]);
            setPage(1);
            setTotal(0);
            setHasMore(false);

            try {
                await fetchPostsPage(1, { append: false });
            } catch (error) {
                if (!cancelled) {
                    console.log(error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadFirstPage();

        return () => {
            cancelled = true;
            requestIdRef.current += 1;
        };
    }, [search, sortBy, hiddenIds, fetchPostsPage, location.key]);

    const loadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) return;

        setLoadingMore(true);

        fetchPostsPage(page + 1, { append: true })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                setLoadingMore(false);
            });
    }, [loading, loadingMore, hasMore, page, fetchPostsPage]);

    const sentinelRef = useInfiniteScrollTrigger({
        hasMore,
        loading: loading || loadingMore,
        onLoadMore: loadMore,
    });

    const deletePost = (id) => {
        setSelectedPostId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deleting) return;

        setDeleting(true);

        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(
                `http://localhost:5000/api/posts/${selectedPostId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setPosts((prev) =>
                    prev.filter((post) => post._id !== selectedPostId)
                );
                setTotal((prev) => Math.max(0, prev - 1));
                showToast("Post deleted successfully");
            } else {
                showToast("Failed to delete post", "error");
            }
        } catch (error) {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setSelectedPostId(null);
        }
    };

    const hasActiveFilters =
        search.trim().length > 0 || hiddenIds.length > 0;
    const showEmptyMarketplace = !loading && total === 0 && !hasActiveFilters;
    const showNoResults = !loading && total === 0 && hasActiveFilters;

    return (
        <>
            <Navbar />

            <div className="page-shell">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Browse Listings</h1>
                        <p className="page-subtitle">
                            Discover products from sellers near you
                        </p>
                    </div>
                </div>

                <div className="marketplace-toolbar">
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search by name, location, or seller..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Newest first</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>

                {loading ? (
                    <div className="page-status">Loading listings...</div>
                ) : showEmptyMarketplace ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiPackage />
                        </div>
                        <h2>No posts available</h2>
                        <p>Be the first to list something for sale.</p>
                        <Link to="/create-post" className="empty-state-btn">
                            Create Post
                        </Link>
                    </div>
                ) : showNoResults ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiSearch />
                        </div>
                        <h2>No results found</h2>
                        <p>Try a different search term or clear filters.</p>
                        <button
                            type="button"
                            className="empty-state-btn"
                            onClick={() => setSearch("")}
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="posts-container">
                            {posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    menuType="auto"
                                    onDelete={deletePost}
                                />
                            ))}
                        </div>

                        <InfiniteScrollFooter
                            sentinelRef={sentinelRef}
                            hasMore={hasMore || loadingMore}
                            visibleCount={posts.length}
                            totalItems={total}
                        />
                    </>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    if (deleting) return;
                    setShowDeleteModal(false);
                    setSelectedPostId(null);
                }}
                onConfirm={confirmDelete}
                loading={deleting}
            />
        </>
    );
}

export default Marketplace;
