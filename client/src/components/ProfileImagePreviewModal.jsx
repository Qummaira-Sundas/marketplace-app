import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_DELAY_MS = 300;
const DOUBLE_TAP_DISTANCE_PX = 28;

function getTouchDistance(touches) {
    const [first, second] = touches;
    const dx = first.clientX - second.clientX;
    const dy = first.clientY - second.clientY;
    return Math.hypot(dx, dy);
}

function ProfileImagePreviewModal({
    isOpen,
    imageUrl,
    alt = "Profile image",
    onClose,
}) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStateRef = useRef(null);
    const touchDragRef = useRef(null);
    const pinchStateRef = useRef(null);
    const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

    const snapToCenter = useCallback(() => {
        setPosition({ x: 0, y: 0 });
    }, []);

    const resetView = useCallback(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const clampZoom = (value) =>
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

    const toggleDoubleTapZoom = useCallback(() => {
        setZoom((current) => {
            if (current > MIN_ZOOM) {
                setPosition({ x: 0, y: 0 });
                return MIN_ZOOM;
            }

            return DOUBLE_TAP_ZOOM;
        });
    }, []);

    const registerTap = useCallback(
        (clientX, clientY) => {
            const now = Date.now();
            const last = lastTapRef.current;
            const deltaTime = now - last.time;
            const deltaDistance = Math.hypot(
                clientX - last.x,
                clientY - last.y
            );

            if (
                deltaTime < DOUBLE_TAP_DELAY_MS &&
                deltaDistance < DOUBLE_TAP_DISTANCE_PX
            ) {
                lastTapRef.current = { time: 0, x: 0, y: 0 };
                toggleDoubleTapZoom();
                return true;
            }

            lastTapRef.current = { time: now, x: clientX, y: clientY };
            return false;
        },
        [toggleDoubleTapZoom]
    );

    useEffect(() => {
        if (!isOpen) return undefined;

        resetView();

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, imageUrl, resetView]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleWheel = (event) => {
        event.preventDefault();

        setZoom((current) => {
            const next = clampZoom(current + (event.deltaY < 0 ? 0.2 : -0.2));

            if (next === MIN_ZOOM) {
                setPosition({ x: 0, y: 0 });
            }

            return next;
        });
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === "touch" || zoom <= MIN_ZOOM) return;

        dragStateRef.current = {
            startX: event.clientX - position.x,
            startY: event.clientY - position.y,
        };

        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (!dragStateRef.current) return;

        setPosition({
            x: event.clientX - dragStateRef.current.startX,
            y: event.clientY - dragStateRef.current.startY,
        });
    };

    const handlePointerEnd = () => {
        if (dragStateRef.current) {
            setIsDragging(false);
            snapToCenter();
        }

        dragStateRef.current = null;
    };

    const handleTouchStart = (event) => {
        if (event.touches.length === 2) {
            pinchStateRef.current = {
                distance: getTouchDistance(event.touches),
                zoom,
            };
            return;
        }

        if (event.touches.length === 1 && zoom > MIN_ZOOM) {
            const touch = event.touches[0];
            touchDragRef.current = {
                startX: touch.clientX - position.x,
                startY: touch.clientY - position.y,
            };
            setIsDragging(true);
        }
    };

    const handleTouchMove = (event) => {
        if (event.touches.length === 2 && pinchStateRef.current) {
            event.preventDefault();

            const distance = getTouchDistance(event.touches);
            const ratio = distance / pinchStateRef.current.distance;
            const next = clampZoom(pinchStateRef.current.zoom * ratio);

            setZoom(next);

            if (next === MIN_ZOOM) {
                setPosition({ x: 0, y: 0 });
            }

            return;
        }

        if (event.touches.length === 1 && touchDragRef.current) {
            event.preventDefault();

            const touch = event.touches[0];
            setPosition({
                x: touch.clientX - touchDragRef.current.startX,
                y: touch.clientY - touchDragRef.current.startY,
            });
        }
    };

    const handleTouchEnd = (event) => {
        const wasDragging = Boolean(touchDragRef.current);

        pinchStateRef.current = null;
        touchDragRef.current = null;

        if (wasDragging) {
            setIsDragging(false);
            snapToCenter();
        }

        if (event.changedTouches.length !== 1) return;

        const touch = event.changedTouches[0];
        registerTap(touch.clientX, touch.clientY);
    };

    const handleDoubleClick = () => {
        toggleDoubleTapZoom();
    };

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="profile-preview-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Profile image preview"
        >
            <div
                className="profile-preview-shell"
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    className={`profile-preview-stage${
                        zoom > MIN_ZOOM ? " is-zoomed" : ""
                    }`}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onDoubleClick={handleDoubleClick}
                >
                    <div
                        className={`profile-preview-frame${
                            isDragging ? " is-dragging" : ""
                        }`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={alt}
                            className="profile-preview-image"
                            draggable={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileImagePreviewModal;
