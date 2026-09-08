import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiPackage } from "react-icons/fi";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { useToast } from "../context/ToastContext";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import InfiniteScrollFooter from "../components/InfiniteScrollFooter";
import { API_URL } from "../utils/api";

function MyListings() {
    const { showToast } = useToast();
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);

    const fetchMyPosts = async () => {
        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(
                `${API_URL}/api/posts/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setPosts(data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

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
               `${API_URL}/api/posts/${selectedPostId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                setPosts(
                    posts.filter((post) => post._id !== selectedPostId)
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

    useEffect(() => {
        setLoading(true);
        fetchMyPosts();
    }, [location.key]);

    const {
        visibleItems,
        sentinelRef,
        hasMore,
        totalItems,
        visibleCount,
    } = useInfiniteScroll(posts);

    return (
        <>
            <Navbar />

            <div className="page-shell">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">My Listings</h1>
                        <p className="page-subtitle">
                            Manage the products you have posted
                        </p>
                    </div>

                    <Link to="/create-post" className="page-header-btn">
                        Create Post
                    </Link>
                </div>

                {loading ? (
                    <div className="page-status">Loading your listings...</div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiPackage />
                        </div>
                        <h2>No posts found</h2>
                        <p>You have not listed any products yet.</p>
                        <Link to="/create-post" className="empty-state-btn">
                            Create your first post
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="posts-container">
                            {visibleItems.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    menuType="owner"
                                    onDelete={deletePost}
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

export default MyListings;
