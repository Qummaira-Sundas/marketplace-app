import { createContext, useCallback, useContext, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message, type = "success") => {
            const id = Date.now() + Math.random();

            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                removeToast(id);
            }, 3200);
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className="toast-container" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                        role="status"
                    >
                        <span className="toast-icon">
                            {toast.type === "error" ? (
                                <FiAlertCircle />
                            ) : (
                                <FiCheckCircle />
                            )}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss"
                        >
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }

    return context;
}
