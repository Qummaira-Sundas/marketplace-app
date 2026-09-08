import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useUserLists } from "../context/UserListsContext";
import {
    createGroupBlurHandler,
    getFieldClass,
    getFormGroupClass,
    shouldShowFieldError,
    touchAllFields,
} from "../utils/formValidation";
import { API_URL } from "../utils/api";
function Login() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { refreshLists, setUserId } = useUserLists();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({ email: false, password: false });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateEmail = (value) => {
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email";
        return "";
    };

    const validatePassword = (value) => {
        if (!value.trim()) return "Password is required";
        return "";
    };

    const validateField = (field, values) => {
        if (field === "email") return validateEmail(values.email);
        if (field === "password") return validatePassword(values.password);
        return "";
    };

    const handleBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setErrors((prev) => ({
            ...prev,
            [field]: validateField(field, { email, password }),
            api: "",
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setSubmitted(true);
        touchAllFields(setTouched, ["email", "password"]);

        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password),
        };

        setErrors((prev) => ({ ...prev, ...newErrors }));

        if (newErrors.email || newErrors.password) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("accessToken", data.accessToken);

                if (data.user?.id) {
                    const id = String(data.user.id);
                    localStorage.setItem("userId", id);
                    setUserId(id);
                }

                if (data.user?.name) {
                    localStorage.setItem("userName", data.user.name);
                }

                if (data.user?.email) {
                    localStorage.setItem("userEmail", data.user.email);
                }

                if (data.user?.profileImage) {
                    localStorage.setItem(
                        "userProfileImage",
                        data.user.profileImage
                    );
                } else if (!localStorage.getItem("userProfileImage")?.startsWith("data:")) {
                    localStorage.removeItem("userProfileImage");
                }

                await refreshLists();
                showToast("Logged in successfully");
                navigate("/marketplace");
            } else if (data.message === "User not found") {
                setSubmitted(true);
                setTouched({ email: true, password: false });
                setErrors({ email: data.message });
            } else if (data.message === "Invalid Password") {
                setSubmitted(true);
                setTouched({ email: true, password: true });
                setErrors({ password: data.message });
            } else {
                setErrors({ api: data.message });
            }
        } catch (error) {
            setErrors({
                api: "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-brand">Marketplace</div>
                <h1>Login</h1>
                <p className="auth-subtitle">Welcome back. Sign in to continue.</p>

                <form onSubmit={handleLogin} noValidate>
                    <div
                        className={getFormGroupClass(
                            errors,
                            touched,
                            submitted,
                            "email"
                        )}
                        onBlur={createGroupBlurHandler("email", handleBlur)}
                    >
                        <input
                            id="email"
                            type="text"
                            className={getFieldClass(
                                errors,
                                touched,
                                submitted,
                                "email"
                            )}
                            placeholder=" "
                            value={email}
                            disabled={loading}
                            aria-invalid={shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "email"
                            )}
                            onBlur={() => handleBlur("email")}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEmail(value);

                                if (touched.email || submitted) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        email: validateEmail(value),
                                        api: "",
                                    }));
                                } else {
                                    setErrors((prev) => ({ ...prev, api: "" }));
                                }
                            }}
                        />

                        <label htmlFor="email">
                            Email <span className="required">*</span>
                        </label>

                        <p className="error">
                            {shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "email"
                            )
                                ? errors.email
                                : ""}
                        </p>
                    </div>

                    <div
                        className={getFormGroupClass(
                            errors,
                            touched,
                            submitted,
                            "password"
                        )}
                        onBlur={createGroupBlurHandler("password", handleBlur)}
                    >
                        <input
                            id="password"
                            type="password"
                            className={getFieldClass(
                                errors,
                                touched,
                                submitted,
                                "password"
                            )}
                            placeholder=" "
                            value={password}
                            disabled={loading}
                            aria-invalid={shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "password"
                            )}
                            onBlur={() => handleBlur("password")}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPassword(value);

                                if (touched.password || submitted) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        password: validatePassword(value),
                                        api: "",
                                    }));
                                } else {
                                    setErrors((prev) => ({ ...prev, api: "" }));
                                }
                            }}
                        />

                        <label htmlFor="password">
                            Password <span className="required">*</span>
                        </label>

                        <p className="error">
                            {shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "password"
                            )
                                ? errors.password
                                : ""}
                        </p>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {errors.api && (
                        <p className="error api-error">{errors.api}</p>
                    )}
                </form>

                <p className="bottom-text">
                    Don't have an account?{" "}
                    <Link to="/signup">Signup</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
