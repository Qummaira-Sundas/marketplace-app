import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { API_URL } from "../utils/api";

const UserListsContext = createContext(null);
const API = `${API_URL}/api`;

const authHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
        Authorization: `Bearer ${token}`,
    };
};

async function readJson(response) {
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (!contentType.includes("application/json")) {
        throw new Error(
            "Favorites API is not reachable. Please restart the backend server."
        );
    }

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Invalid response from server");
    }
}

function getUserIdFromToken() {
    const token = localStorage.getItem("accessToken");
    if (!token) return "";

    try {
        const payloadPart = token.split(".")[1];
        if (!payloadPart) return "";

        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );
        const payload = JSON.parse(atob(padded));

        return String(payload.userId || payload.id || "");
    } catch {
        return "";
    }
}

function getOwnerId(post) {
    const createdBy = post?.createdBy;

    if (!createdBy) return "";
    if (typeof createdBy === "string") return createdBy;

    return String(createdBy._id || createdBy.id || "");
}

function readCachedFavorites(userId) {
    if (!userId) return [];

    try {
        const raw = localStorage.getItem(`favorites:${userId}`);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function writeCachedFavorites(userId, ids) {
    if (!userId) return;
    localStorage.setItem(`favorites:${userId}`, JSON.stringify(ids.map(String)));
}

export function UserListsProvider({ children }) {
    const initialUserId =
        localStorage.getItem("userId") || getUserIdFromToken() || "";

    const [favoriteIds, setFavoriteIds] = useState(() =>
        readCachedFavorites(initialUserId)
    );
    const [hiddenIds, setHiddenIds] = useState([]);
    const [userId, setUserId] = useState(initialUserId);
    const [ready, setReady] = useState(false);

    const refreshLists = useCallback(async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setFavoriteIds([]);
            setHiddenIds([]);
            setUserId("");
            localStorage.removeItem("userId");
            setReady(true);
            return;
        }

        const tokenUserId = getUserIdFromToken();
        const activeUserId = tokenUserId || localStorage.getItem("userId") || "";

        if (activeUserId) {
            localStorage.setItem("userId", activeUserId);
            setUserId(activeUserId);
            setFavoriteIds(readCachedFavorites(activeUserId));
        }

        try {
            // Prefer posts favorites list + token user id (more reliable)
            const favResponse = await fetch(`${API}/posts/favorites`, {
                headers: authHeaders(),
            });

            if (favResponse.ok) {
                const posts = await readJson(favResponse);
                const ids = (Array.isArray(posts) ? posts : []).map((p) =>
                    String(p._id)
                );
                setFavoriteIds(ids);
                writeCachedFavorites(activeUserId, ids);
            }

            // Optional: also sync hidden posts from /users/me if available
            try {
                const meResponse = await fetch(`${API}/users/me`, {
                    headers: authHeaders(),
                });

                if (meResponse.ok) {
                    const data = await readJson(meResponse);
                    const id = String(data.id || activeUserId || "");

                    if (id) {
                        localStorage.setItem("userId", id);
                        setUserId(id);
                    }

                    if (Array.isArray(data.favorites) && data.favorites.length) {
                        const ids = data.favorites.map(String);
                        setFavoriteIds(ids);
                        writeCachedFavorites(id, ids);
                    }

                    setHiddenIds((data.hiddenPosts || []).map(String));
                }
            } catch {
                // ignore optional /users/me failures
            }
        } catch (error) {
            console.log(error);
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        refreshLists();
    }, [refreshLists]);

    const isFavorite = useCallback(
        (postId) => favoriteIds.includes(String(postId)),
        [favoriteIds]
    );

    const isHidden = useCallback(
        (postId) => hiddenIds.includes(String(postId)),
        [hiddenIds]
    );

    const isOwner = useCallback(
        (post) => {
            const currentId = String(
                userId ||
                localStorage.getItem("userId") ||
                getUserIdFromToken() ||
                ""
            );
            const ownerId = getOwnerId(post);

            return Boolean(currentId && ownerId && currentId === ownerId);
        },
        [userId]
    );

    const toggleFavorite = useCallback(async (postId) => {
        const id = String(postId);
        const activeUserId =
            userId || localStorage.getItem("userId") || getUserIdFromToken();

        let wasFavorited = false;

        setFavoriteIds((prev) => {
            wasFavorited = prev.includes(id);
            const next = wasFavorited
                ? prev.filter((item) => item !== id)
                : [...prev, id];

            writeCachedFavorites(activeUserId, next);
            return next;
        });

        try {
            const response = await fetch(`${API}/posts/${id}/favorite`, {
                method: "POST",
                headers: authHeaders(),
            });

            const data = await readJson(response);

            if (!response.ok) {
                setFavoriteIds((prev) => {
                    const rolledBack = wasFavorited
                        ? prev.includes(id)
                            ? prev
                            : [...prev, id]
                        : prev.filter((item) => item !== id);

                    writeCachedFavorites(activeUserId, rolledBack);
                    return rolledBack;
                });
                throw new Error(data.message || "Failed to update favorite");
            }

            const nextFavorites = (data.favorites || []).map(String);
            setFavoriteIds(nextFavorites);
            writeCachedFavorites(activeUserId, nextFavorites);

            return {
                favorited: data.favorited,
                favorites: nextFavorites,
                message: data.message,
            };
        } catch (error) {
            setFavoriteIds((prev) => {
                const rolledBack = wasFavorited
                    ? prev.includes(id)
                        ? prev
                        : [...prev, id]
                    : prev.filter((item) => item !== id);

                writeCachedFavorites(activeUserId, rolledBack);
                return rolledBack;
            });
            throw error;
        }
    }, [userId]);

    const hidePost = useCallback(async (postId) => {
        const response = await fetch(`${API}/users/hidden/${postId}`, {
            method: "POST",
            headers: authHeaders(),
        });

        const data = await readJson(response);

        if (!response.ok) {
            throw new Error(data.message || "Failed to hide post");
        }

        setHiddenIds((data.hiddenPosts || []).map(String));
        return data;
    }, []);

    const value = useMemo(
        () => ({
            ready,
            userId,
            favoriteIds,
            hiddenIds,
            isFavorite,
            isHidden,
            isOwner,
            toggleFavorite,
            hidePost,
            refreshLists,
            setUserId,
        }),
        [
            ready,
            userId,
            favoriteIds,
            hiddenIds,
            isFavorite,
            isHidden,
            isOwner,
            toggleFavorite,
            hidePost,
            refreshLists,
        ]
    );

    return (
        <UserListsContext.Provider value={value}>
            {children}
        </UserListsContext.Provider>
    );
}

export function useUserLists() {
    const context = useContext(UserListsContext);

    if (!context) {
        throw new Error("useUserLists must be used within UserListsProvider");
    }

    return context;
}
