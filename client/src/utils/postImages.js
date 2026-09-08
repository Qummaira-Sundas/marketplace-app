import { API_URL } from "./api";

const API_ORIGIN = API_URL;

export function getPostImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("data:") || imagePath.startsWith("http")) {
        return imagePath;
    }
    return `${API_ORIGIN}${imagePath}`;
}

export function getPostImages(post) {
    if (!post) return [];

    if (Array.isArray(post.images) && post.images.length) {
        return post.images.filter(Boolean);
    }

    if (post.image) {
        return [post.image];
    }

    return [];
}

export function getPostCoverImage(post) {
    const images = getPostImages(post);
    return images[0] || "";
}
