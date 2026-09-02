import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    FiArrowLeft,
    FiMapPin,
    FiMail,
    FiMessageCircle,
    FiClock,
    FiHeart,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import ProductImageGallery from "../components/ProductImageGallery";
import { formatPrice, formatRelativeTime } from "../utils/formatters";
import { getPostImages } from "../utils/postImages";
import { useUserLists } from "../context/UserListsContext";
import { useToast } from "../context/ToastContext";

function PostDetail() {
    const { id } = useParams();
    const { showToast } = useToast();
    const { isFavorite, toggleFavorite } = useUserLists();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/posts/${id}`
                );

                const data = await response.json();

                if (response.ok) {
                    setPost(data);
                } else {
                    setPost(null);
                }
            } catch (error) {
                console.log(error);
                setPost(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const getInitials = (name = "") =>
        name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

    const handleFavorite = async () => {
        if (!post || favoriteLoading) return;

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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="detail-page">
                    <div className="detail-loading">Loading product details...</div>
                </div>
            </>
        );
    }

    if (!post) {
        return (
            <>
                <Navbar />
                <div className="detail-page">
                    <div className="detail-error">
                        <h2>Product not found</h2>
                        <Link to="/marketplace" className="detail-back-link">
                            <FiArrowLeft />
                            Back to Marketplace
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="detail-page">
                <div className="detail-topbar">
                    <Link to="/marketplace" className="detail-back-link">
                        <FiArrowLeft />
                        Back to Marketplace
                    </Link>
                </div>

                <article className="detail-panel">
                    <div className="detail-media">
                        <ProductImageGallery
                            images={getPostImages(post)}
                            alt={post.productName}
                        />
                    </div>

                    <div className="detail-content">
                        <div className="product-details">
                            <div className="detail-price-row">
                                <p className="detail-price">
                                    Rs {formatPrice(post.price)}
                                </p>

                                <button
                                    type="button"
                                    className={`detail-favorite-btn ${
                                        isFavorite(post._id) ? "active" : ""
                                    }`}
                                    onClick={handleFavorite}
                                    disabled={favoriteLoading}
                                >
                                    <FiHeart
                                        fill={
                                            isFavorite(post._id)
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                    {isFavorite(post._id) ? "Favorited" : "Favorite"}
                                </button>
                            </div>

                            <h1 className="detail-title">{post.productName}</h1>

                            <div className="detail-meta">
                                <span className="detail-meta-item">
                                    <FiMapPin />
                                    {post.location}
                                </span>
                                <span className="detail-meta-item">
                                    <FiClock />
                                    {formatRelativeTime(post.createdAt)}
                                </span>
                            </div>

                            <div className="detail-section">
                                <h3 className="detail-section-title">Description</h3>
                                <p className="detail-description">{post.description}</p>
                            </div>
                        </div>

                        <div className="seller">
                            <h2 className="seller-title">Seller Information</h2>

                            <div className="seller-profile">
                                <div className="seller-avatar">
                                    {getInitials(post.createdBy?.name)}
                                </div>

                                <div className="seller-info">
                                    <p className="seller-name">
                                        {post.createdBy?.name}
                                    </p>
                                    <p className="seller-row">
                                        <FiMapPin />
                                        <span>{post.location}</span>
                                    </p>
                                    <p className="seller-row">
                                        <FiMail />
                                        <span>{post.createdBy?.email}</span>
                                    </p>
                                </div>
                            </div>

                            <button type="button" className="seller-chat-btn">
                                <FiMessageCircle />
                                Chat with Seller
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        </>
    );
}

export default PostDetail;
