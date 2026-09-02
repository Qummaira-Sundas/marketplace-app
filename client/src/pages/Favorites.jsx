import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { useToast } from "../context/ToastContext";
import { useUserLists } from "../context/UserListsContext";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import InfiniteScrollFooter from "../components/InfiniteScrollFooter";

function Favorites() {
    const { showToast } = useToast();
    const { favoriteIds, isOwner, ready } = useUserLists();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);

    const fetchFavorites = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(
                "http://localhost:5000/api/posts/favorites",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setPosts(Array.isArray(data) ? data : []);
            } else {
                setPosts([]);
            }
        } catch (error) {
            console.log(error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load from server whenever favorites change or page becomes ready
    useEffect(() => {
        if (!ready) return;

        setLoading(true);
        fetchFavorites();
    }, [ready, favoriteIds, fetchFavorites]);

    const {
        visibleItems,
        sentinelRef,
        hasMore,
        totalItems,
        visibleCount,
    } = useInfiniteScroll(posts);

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

    return (
        <>
            <Navbar />

            <div className="page-shell">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Favorites</h1>
                        <p className="page-subtitle">
                            Posts you saved for later
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="page-status">Loading favorites...</div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiHeart />
                        </div>
                        <h2>No favorites yet</h2>
                        <p>Tap the heart on a listing to save it here.</p>
                        <Link to="/marketplace" className="empty-state-btn">
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="posts-container">
                            {visibleItems.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    menuType="auto"
                                    onDelete={
                                        isOwner(post) ? deletePost : undefined
                                    }
                                />
                            ))}
                        </div>

                        <InfiniteScrollFooter
                            sentinelRef={sentinelRef}
                            hasMore={hasMore}
                            visibleCount={visibleCount}
                            totalItems={totalItems}
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

export default Favorites;
