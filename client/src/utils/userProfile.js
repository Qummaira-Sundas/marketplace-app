const PROFILE_IMAGE_KEY = "userProfileImage";
const API_ORIGIN = "http://localhost:5000";
const API_BASE = `${API_ORIGIN}/api/users`;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function getStoredProfileImage() {
    return localStorage.getItem(PROFILE_IMAGE_KEY) || "";
}

export function setStoredProfileImage(value) {
    if (value) {
        localStorage.setItem(PROFILE_IMAGE_KEY, value);
    } else {
        localStorage.removeItem(PROFILE_IMAGE_KEY);
    }
}

export function clearStoredProfileImage() {
    localStorage.removeItem(PROFILE_IMAGE_KEY);
}

export function getProfileImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("data:") || imagePath.startsWith("http")) {
        return imagePath;
    }
    return `${API_ORIGIN}${imagePath}`;
}

export function validateProfileImageFile(file) {
    if (!file) {
        return "Please select an image";
    }

    if (!file.type.startsWith("image/")) {
        return "Only image files are allowed";
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return "Image must be smaller than 5 MB";
    }

    return "";
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
    });
}

export async function fetchUserProfile(token) {
    const response = await fetch(`${API_BASE}/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch profile");
    }

    return response.json();
}

export function applyProfileData(data) {
    if (data.name) {
        localStorage.setItem("userName", data.name);
    }

    if (data.email) {
        localStorage.setItem("userEmail", data.email);
    }

    let profileImage = "";

    if (data.profileImage) {
        profileImage = data.profileImage;
        setStoredProfileImage(profileImage);
    } else {
        const stored = getStoredProfileImage();
        if (stored.startsWith("data:")) {
            profileImage = stored;
        } else {
            clearStoredProfileImage();
        }
    }

    return {
        name: data.name || localStorage.getItem("userName") || "",
        email: data.email || localStorage.getItem("userEmail") || "",
        profileImage,
    };
}

export async function uploadProfileImage(file, token) {
    const validationError = validateProfileImageFile(file);
    if (validationError) {
        throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
        const response = await fetch(`${API_BASE}/me/profile-image`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.profileImage) {
            setStoredProfileImage(data.profileImage);
            return {
                profileImage: data.profileImage,
                savedLocally: false,
            };
        }
    } catch {
        // Fall through to local storage when the API is unavailable.
    }

    const dataUrl = await readFileAsDataUrl(file);
    setStoredProfileImage(dataUrl);

    return {
        profileImage: dataUrl,
        savedLocally: true,
    };
}
