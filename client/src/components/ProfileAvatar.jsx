import { FiEdit2 } from "react-icons/fi";
import { getProfileImageUrl } from "../utils/userProfile";

export function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function ProfileAvatar({
    name,
    imagePath = "",
    size = "md",
    editable = false,
    onEditClick,
    onPreviewClick,
    uploading = false,
}) {
    const imageUrl = getProfileImageUrl(imagePath);
    const sizeClass =
        size === "lg"
            ? "nav-sidebar-avatar"
            : size === "menu"
              ? "nav-profile-menu-avatar"
              : "nav-profile-avatar";
    const canPreview = Boolean(imageUrl && onPreviewClick);

    const avatarContent = imageUrl ? (
        canPreview ? (
            <button
                type="button"
                className="profile-avatar-preview-btn"
                onClick={onPreviewClick}
                aria-label="View profile image"
            >
                <img
                    src={imageUrl}
                    alt=""
                    className={`${sizeClass} profile-avatar-image`}
                />
            </button>
        ) : (
            <img
                src={imageUrl}
                alt=""
                className={`${sizeClass} profile-avatar-image`}
            />
        )
    ) : (
        <span className={`nav-profile-avatar ${sizeClass}`}>
            {getInitials(name)}
        </span>
    );

    if (!editable) {
        return avatarContent;
    }

    return (
        <div className="nav-sidebar-avatar-wrap">
            {avatarContent}
            <button
                type="button"
                className="nav-sidebar-avatar-edit"
                onClick={onEditClick}
                disabled={uploading}
                aria-label="Edit profile image"
            >
                <FiEdit2 />
            </button>
        </div>
    );
}

export default ProfileAvatar;
