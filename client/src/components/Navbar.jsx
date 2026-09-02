import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    FiChevronDown,
    FiHeart,
    FiHome,
    FiMenu,
    FiPackage,
    FiPlus,
    FiX,
} from "react-icons/fi";
import ProfileAvatar from "./ProfileAvatar";
import ProfileImagePreviewModal from "./ProfileImagePreviewModal";
import { useToast } from "../context/ToastContext";
import { useUserLists } from "../context/UserListsContext";
import {
    applyProfileData,
    clearStoredProfileImage,
    fetchUserProfile,
    getProfileImageUrl,
    getStoredProfileImage,
    uploadProfileImage,
} from "../utils/userProfile";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { refreshLists } = useUserLists();
    const menuRef = useRef(null);
    const profileImageInputRef = useRef(null);

    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
    const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
    const [userName, setUserName] = useState(
        () => localStorage.getItem("userName") || ""
    );
    const [userEmail, setUserEmail] = useState(
        () => localStorage.getItem("userEmail") || ""
    );
    const [profileImage, setProfileImage] = useState(() => getStoredProfileImage());

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setUserName("");
            setUserEmail("");
            setProfileImage("");
            return;
        }

        const loadProfile = async () => {
            try {
                const data = await fetchUserProfile(token);
                const profile = applyProfileData(data);
                setUserName(profile.name);
                setUserEmail(profile.email);
                setProfileImage(profile.profileImage);
            } catch {
                setProfileImage(getStoredProfileImage());
            }
        };

        loadProfile();
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setSidebarOpen(false);
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!sidebarOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    const closeSidebar = () => setSidebarOpen(false);

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        clearStoredProfileImage();
        setUserName("");
        setUserEmail("");
        setProfileImage("");
        setMenuOpen(false);
        setSidebarOpen(false);
        refreshLists();
        navigate("/login");
    };

    const isActive = (path) =>
        location.pathname === path ? "nav-link active" : "nav-link";

    const isSidebarActive = (path) =>
        location.pathname === path
            ? "nav-sidebar-link active"
            : "nav-sidebar-link";

    const handleProfileImageSelect = () => {
        profileImageInputRef.current?.click();
    };

    const openProfilePreview = () => {
        if (!profileImage) return;
        setProfilePreviewOpen(true);
    };

    const closeProfilePreview = () => setProfilePreviewOpen(false);

    const profilePreviewUrl = getProfileImageUrl(profileImage);

    const handleProfileImageChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
            showToast("Please log in to update your profile image", "error");
            return;
        }

        setUploadingProfileImage(true);

        try {
            const result = await uploadProfileImage(file, token);
            setProfileImage(result.profileImage);
            showToast(
                result.savedLocally
                    ? "Profile image saved on this device"
                    : "Profile image updated"
            );
        } catch (error) {
            showToast(
                error.message || "Failed to update profile image",
                "error"
            );
        } finally {
            setUploadingProfileImage(false);
            event.target.value = "";
        }
    };

    const navItems = [
        { to: "/marketplace", label: "Marketplace", icon: FiHome },
        { to: "/my-listings", label: "My Listings", icon: FiPackage },
        { to: "/favorites", label: "Favorites", icon: FiHeart },
        { to: "/create-post", label: "Create Post", icon: FiPlus },
    ];

    return (
        <nav className="navbar">
            <Link to="/marketplace" className="logo">
                Marketplace
            </Link>

            <div className="nav-links">
                <Link to="/marketplace" className={isActive("/marketplace")}>
                    Marketplace
                </Link>

                <Link to="/favorites" className={isActive("/favorites")}>
                    Favorites
                </Link>

                <Link to="/my-listings" className={isActive("/my-listings")}>
                    My Listings
                </Link>

                <Link to="/create-post" className={isActive("/create-post")}>
                    Create Post
                </Link>
            </div>

            <div className="nav-profile" ref={menuRef}>
                <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    className="nav-sidebar-avatar-input"
                    onChange={handleProfileImageChange}
                    aria-hidden="true"
                    tabIndex={-1}
                />

                <div className="nav-profile-trigger">
                    <ProfileAvatar
                        name={userName}
                        imagePath={profileImage}
                        size="md"
                        onPreviewClick={
                            profileImage ? openProfilePreview : undefined
                        }
                    />

                    <button
                        type="button"
                        className="nav-profile-trigger-main"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                    >
                        <span className="nav-profile-name">
                            {userName || "User"}
                        </span>
                        <FiChevronDown className="nav-profile-chevron" />
                    </button>
                </div>

                {menuOpen && (
                    <div className="nav-profile-menu">
                        <div className="nav-profile-menu-header">
                            <ProfileAvatar
                                name={userName}
                                imagePath={profileImage}
                                size="menu"
                                editable
                                uploading={uploadingProfileImage}
                                onEditClick={handleProfileImageSelect}
                                onPreviewClick={
                                    profileImage ? openProfilePreview : undefined
                                }
                            />

                            <strong>{userName || "User"}</strong>
                            <span>{userEmail || "Signed in"}</span>
                        </div>

                        <button
                            type="button"
                            className="nav-profile-menu-logout"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            <button
                type="button"
                className="nav-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
            >
                <FiMenu />
            </button>

            {sidebarOpen && (
                <>
                    <button
                        type="button"
                        className="nav-sidebar-overlay"
                        onClick={closeSidebar}
                        aria-label="Close menu"
                    />

                    <aside className="nav-sidebar" aria-label="Mobile navigation">
                        <div className="nav-sidebar-header">
                            <button
                                type="button"
                                className="nav-sidebar-close"
                                onClick={closeSidebar}
                                aria-label="Close menu"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="nav-sidebar-profile">
                            <ProfileAvatar
                                name={userName}
                                imagePath={profileImage}
                                size="lg"
                                editable
                                uploading={uploadingProfileImage}
                                onEditClick={handleProfileImageSelect}
                                onPreviewClick={
                                    profileImage ? openProfilePreview : undefined
                                }
                            />
                            <strong>{userName || "User"}</strong>
                            <span>{userEmail || "Signed in"}</span>
                        </div>

                        <nav className="nav-sidebar-links">
                            {navItems.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={isSidebarActive(to)}
                                    onClick={closeSidebar}
                                >
                                    <Icon
                                        className="nav-sidebar-link-icon"
                                        aria-hidden="true"
                                    />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </nav>

                        <button
                            type="button"
                            className="nav-sidebar-logout"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </aside>
                </>
            )}

            <ProfileImagePreviewModal
                isOpen={profilePreviewOpen}
                imageUrl={profilePreviewUrl}
                alt={`${userName || "User"} profile`}
                onClose={closeProfilePreview}
            />
        </nav>
    );
}

export default Navbar;
