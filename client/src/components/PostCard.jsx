import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiEdit2,
    FiTrash2,
    FiMoreVertical,
    FiMapPin,
    FiClock,
    FiHeart,
    FiEyeOff,
    FiSlash,
    FiFlag,
} from "react-icons/fi";

import { formatPrice, formatRelativeTime } from "../utils/formatters";
import { getPostCoverImage, getPostImageUrl } from "../utils/postImages";
import { useUserLists } from "../context/UserListsContext";
import { useToast } from "../context/ToastContext";

function PostCard({
    post,
    onDelete,
    menuType = "auto", // "owner" | "visitor" | "auto"
}) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const {
        isFavorite,
        isOwner,
        toggleFavorite,
        hidePost,
    } = useUserLists();

    const [showMenu, setShowMenu] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const menuRef = useRef(null);

    const favorited = isFavorite(post._id);
    const owner =
        menuType === "owner"
            ? true
            : menuType === "visitor"
                ? false
                : isOwner(post);

    useEffect(() => {
        if (!showMenu) return undefined;

        const handleOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") setShowMenu(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [showMenu]);

    const handleFavorite = async (e) => {
        e.stopPropagation();

        if (favoriteLoading) return;

        setFavoriteLoading(true);

        try {
            const data = await toggleFavorite(post._id);
            showToast(data.message);
        } catch (error) {
            showToast(error.message || "Could not update favorite", "error");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleHide = async () => {
        setShowMenu(false);

        try {
            const data = await hidePost(post._id);
            showToast(data.message);
        } catch (error) {
            showToast(error.message || "Could not hide post", "error");
        }
    };

    const handleNotInterested = async () => {
        setShowMenu(false);

        try {
            await hidePost(post._id);
            showToast("Got it — we'll show fewer posts like this");
        } catch (error) {
            showToast(error.message || "Could not update preference", "error");
        }
    };

    const handleReport = () => {
        setShowMenu(false);
        showToast("Thanks — this listing was reported for review");
    };

    return (
        <div
            className="post-card"
            onClick={() => {
                if (showMenu) {
                    setShowMenu(false);
                    return;
                }
                navigate(`/post/${post._id}`);
            }}
        >
            <div className="post-image-wrap">
                <img
                    className="post-image"
                    src={`${getPostImageUrl(getPostCoverImage(post))}?v=${encodeURIComponent(post.updatedAt || post._id)}`}
                    alt={post.productName}
                />

                <button
                    type="button"
                    className={`favorite-btn ${favorited ? "active" : ""}`}
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                    title={favorited ? "Remove from favorites" : "Add to favorites"}
                >
                    <FiHeart
                        fill={favorited ? "currentColor" : "none"}
                    />
                </button>
            </div>

            <div className="post-content">
                <h2 className="post-price">
                    Rs {formatPrice(post.price)}
                </h2>

                <h3 className="post-title">
                    {post.productName}
                </h3>

                <p className="post-location">
                    <FiMapPin />
                    {post.location}
                </p>

                <p className="post-description">
                    {post.description}
                </p>

                <div className="post-footer">
                    <hr />

                    <div className="post-footer-bottom">
                        <div className="post-footer-meta">
                            <p className="post-owner">
                                Posted by <strong>{post.createdBy?.name}</strong>
                            </p>
                            <p className="post-time">
                                <FiClock />
                                {formatRelativeTime(post.createdAt)}
                            </p>
                        </div>

                        <div className="post-menu" ref={menuRef}>
                            <button
                                type="button"
                                className="menu-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu((open) => !open);
                                }}
                            >
                                <FiMoreVertical />
                            </button>

                            {showMenu && (
                                <div
                                    className="menu-dropdown"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {owner ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    navigate("/create-post", {
                                                        state: { post },
                                                    });
                                                }}
                                            >
                                                <FiEdit2 />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="menu-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(false);
                                                    onDelete?.(post._id);
                                                }}
                                            >
                                                <FiTrash2 />
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleHide();
                                                }}
                                            >
                                                <FiEyeOff />
                                                Hide post
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNotInterested();
                                                }}
                                            >
                                                <FiSlash />
                                                Not interested
                                            </button>

                                            <button
                                                type="button"
                                                className="menu-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReport();
                                                }}
                                            >
                                                <FiFlag />
                                                Report listing
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostCard;
