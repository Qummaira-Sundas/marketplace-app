export function formatRelativeTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (Number.isNaN(seconds) || seconds < 0) return "";
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 5) {
        return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }

    return date.toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatPrice(price) {
    return Number(price).toLocaleString("en-PK");
}
