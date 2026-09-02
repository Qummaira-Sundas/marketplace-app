import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
    createGroupBlurHandler,
    getFieldClass,
    getFormGroupClass,
    shouldShowFieldError,
    touchAllFields,
} from "../utils/formValidation";

function Signup() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const values = { name, email, password };

    const validateName = (value) => {
        if (!value.trim()) return "Name is required";
        if (!/^[A-Za-z ]+$/.test(value)) {
            return "Name can contain only letters and spaces";
        }
        if (value.trim().length < 3) return "Name must be at least 3 characters";
        return "";
    };

    const validateEmail = (value) => {
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email";
        return "";
    };

    const validatePassword = (value) => {
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
    };

    const validateField = (field, fieldValues = values) => {
        if (field === "name") return validateName(fieldValues.name);
        if (field === "email") return validateEmail(fieldValues.email);
        if (field === "password") return validatePassword(fieldValues.password);
        return "";
    };

    const handleBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setErrors((prev) => ({
            ...prev,
            [field]: validateField(field),
            api: "",
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        setSubmitted(true);
        touchAllFields(setTouched, ["name", "email", "password"]);

        const newErrors = {
            name: validateName(name),
            email: validateEmail(email),
            password: validatePassword(password),
        };

        setErrors((prev) => ({ ...prev, ...newErrors }));

        if (newErrors.name || newErrors.email || newErrors.password) return;

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                showToast("Account created successfully. Please login.");
                navigate("/login");
            } else if (
                data.message === "Name can contain only letters and spaces" ||
                data.message === "Name must be at least 3 characters"
            ) {
                setSubmitted(true);
                setTouched({ name: true, email: false, password: false });
                setErrors({ name: data.message });
            } else if (
                data.message === "Please enter a valid email" ||
                data.message === "Email already registered"
            ) {
                setSubmitted(true);
                setTouched({ name: true, email: true, password: false });
                setErrors({ email: data.message });
            } else if (data.message === "Password must be at least 6 characters") {
                setSubmitted(true);
                setTouched({ name: true, email: true, password: true });
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

    const updateField = (field, value) => {
        if (field === "name") setName(value);
        if (field === "email") setEmail(value);
        if (field === "password") setPassword(value);

        const nextValues = { ...values, [field]: value };

        if (touched[field] || submitted) {
            setErrors((prev) => ({
                ...prev,
                [field]: validateField(field, nextValues),
                api: "",
            }));
        } else {
            setErrors((prev) => ({ ...prev, api: "" }));
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-brand">Marketplace</div>
                <h1>Signup</h1>
                <p className="auth-subtitle">Create an account to start selling.</p>

                <form onSubmit={handleSignup} noValidate>
                    <div
                        className={getFormGroupClass(
                            errors,
                            touched,
                            submitted,
                            "name"
                        )}
                        onBlur={createGroupBlurHandler("name", handleBlur)}
                    >
                        <input
                            id="name"
                            type="text"
                            className={getFieldClass(
                                errors,
                                touched,
                                submitted,
                                "name"
                            )}
                            placeholder=" "
                            value={name}
                            disabled={loading}
                            aria-invalid={shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "name"
                            )}
                            onBlur={() => handleBlur("name")}
                            onChange={(e) => updateField("name", e.target.value)}
                        />

                        <label htmlFor="name">
                            Name <span className="required">*</span>
                        </label>

                        <p className="error">
                            {shouldShowFieldError(
                                errors,
                                touched,
                                submitted,
                                "name"
                            )
                                ? errors.name
                                : ""}
                        </p>
                    </div>

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
                            onChange={(e) => updateField("email", e.target.value)}
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
                            onChange={(e) =>
                                updateField("password", e.target.value)
                            }
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
                        {loading ? "Creating account..." : "Signup"}
                    </button>

                    {errors.api && (
                        <p className="api-error">{errors.api}</p>
                    )}
                </form>

                <p className="bottom-text">
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;
