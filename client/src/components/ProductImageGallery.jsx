import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiChevronUp,
    FiMaximize2,
    FiX,
} from "react-icons/fi";
import { getPostImageUrl } from "../utils/postImages";

const VISIBLE_THUMBNAILS = 3;
const VISIBLE_THUMBNAILS_MOBILE = 4;
const THUMB_GAP = 10;
const THUMB_SIZE = 88;
const THUMB_SIZE_MOBILE = 72;
const MOBILE_GALLERY_QUERY = "(max-width: 900px)";

function getThumbSize(horizontal) {
    if (!horizontal) return THUMB_SIZE;
    return window.innerWidth <= 600 ? THUMB_SIZE_MOBILE : THUMB_SIZE;
}

function useHorizontalThumbs() {
    const [horizontal, setHorizontal] = useState(() =>
        window.matchMedia(MOBILE_GALLERY_QUERY).matches
    );
    const [thumbSize, setThumbSize] = useState(() => getThumbSize(horizontal));

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_GALLERY_QUERY);

        const updateLayout = () => {
            const isHorizontal = mediaQuery.matches;
            setHorizontal(isHorizontal);
            setThumbSize(getThumbSize(isHorizontal));
        };

        updateLayout();
        mediaQuery.addEventListener("change", updateLayout);
        window.addEventListener("resize", updateLayout);

        return () => {
            mediaQuery.removeEventListener("change", updateLayout);
            window.removeEventListener("resize", updateLayout);
        };
    }, []);

    return { horizontal, thumbSize };
}

function ProductImageGallery({ images = [], alt = "Product image" }) {
    const galleryImages = useMemo(
        () => images.filter(Boolean),
        [images]
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const [thumbOffset, setThumbOffset] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const thumbViewportRef = useRef(null);
    const { horizontal: isHorizontalThumbs, thumbSize } = useHorizontalThumbs();

    const visibleThumbs = isHorizontalThumbs
        ? VISIBLE_THUMBNAILS_MOBILE
        : VISIBLE_THUMBNAILS;
    const thumbStep = thumbSize + THUMB_GAP;

    const hasMultiple = galleryImages.length > 1;
    const canScrollThumbs = galleryImages.length > visibleThumbs;
    const maxThumbOffset = Math.max(
        0,
        galleryImages.length - visibleThumbs
    );
    const activeImage = galleryImages[activeIndex] || galleryImages[0] || "";
    const activeImageUrl = getPostImageUrl(activeImage);

    useEffect(() => {
        setActiveIndex(0);
        setThumbOffset(0);
    }, [galleryImages]);

    useEffect(() => {
        setThumbOffset((current) => {
            if (activeIndex < current) {
                return activeIndex;
            }

            if (activeIndex >= current + visibleThumbs) {
                return activeIndex - visibleThumbs + 1;
            }

            return current;
        });
    }, [activeIndex, visibleThumbs]);

    useEffect(() => {
        setThumbOffset((current) => Math.min(current, maxThumbOffset));
    }, [maxThumbOffset, isHorizontalThumbs]);

    const scrollThumbs = useCallback(
        (direction) => {
            setThumbOffset((current) => {
                if (direction > 0) {
                    return Math.min(maxThumbOffset, current + 1);
                }

                return Math.max(0, current - 1);
            });
        },
        [maxThumbOffset]
    );

    useEffect(() => {
        const viewport = thumbViewportRef.current;
        if (!viewport || !canScrollThumbs) return undefined;

        const handleWheel = (event) => {
            event.preventDefault();
            const delta =
                isHorizontalThumbs && Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY;
            scrollThumbs(delta > 0 ? 1 : -1);
        };

        viewport.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            viewport.removeEventListener("wheel", handleWheel);
        };
    }, [canScrollThumbs, scrollThumbs, isHorizontalThumbs]);

    useEffect(() => {
        if (!previewOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setPreviewOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [previewOpen]);

    if (!galleryImages.length) {
        return (
            <div className="product-gallery product-gallery--empty">
                <div className="product-gallery__main product-gallery__main--empty">
                    No image available
                </div>
            </div>
        );
    }

    const showThumbPrev = canScrollThumbs && thumbOffset > 0;
    const showThumbNext = canScrollThumbs && thumbOffset < maxThumbOffset;
    const visibleThumbCount = Math.min(galleryImages.length, visibleThumbs);
    const thumbViewportSize =
        visibleThumbCount * thumbStep - THUMB_GAP;
    const thumbListOffset = thumbOffset * thumbStep;

    const goToPrevious = () => {
        setActiveIndex((current) =>
            current === 0 ? galleryImages.length - 1 : current - 1
        );
    };

    const goToNext = () => {
        setActiveIndex((current) =>
            current === galleryImages.length - 1 ? 0 : current + 1
        );
    };

    return (
        <>
            <div
                className={`product-gallery${
                    isHorizontalThumbs ? " product-gallery--horizontal-thumbs" : ""
                }`}
            >
                <div className="product-gallery__thumbs">
                    <div className="product-gallery__thumbs-inner">
                        {canScrollThumbs && (
                            <button
                                type="button"
                                className={`product-gallery__thumb-nav${
                                    isHorizontalThumbs
                                        ? " product-gallery__thumb-nav--prev"
                                        : " product-gallery__thumb-nav--up"
                                }${showThumbPrev ? "" : " is-disabled"}`}
                                onClick={() => scrollThumbs(-1)}
                                disabled={!showThumbPrev}
                                aria-label="Show previous thumbnails"
                            >
                                {isHorizontalThumbs ? (
                                    <FiChevronLeft />
                                ) : (
                                    <FiChevronUp />
                                )}
                            </button>
                        )}

                        <div
                            ref={thumbViewportRef}
                            className="product-gallery__thumb-viewport"
                            style={
                                isHorizontalThumbs
                                    ? {
                                          width: `${thumbViewportSize}px`,
                                          height: `${thumbSize}px`,
                                      }
                                    : {
                                          width: `${thumbSize}px`,
                                          height: `${thumbViewportSize}px`,
                                      }
                            }
                        >
                            <div
                                className="product-gallery__thumb-list"
                                style={{
                                    transform: isHorizontalThumbs
                                        ? `translateX(-${thumbListOffset}px)`
                                        : `translateY(-${thumbListOffset}px)`,
                                }}
                            >
                                {galleryImages.map((imagePath, index) => {
                                    const isActive = index === activeIndex;

                                    return (
                                        <button
                                            key={`${imagePath}-${index}`}
                                            type="button"
                                            className={`product-gallery__thumb${
                                                isActive ? " active" : ""
                                            }`}
                                            onClick={() => setActiveIndex(index)}
                                            aria-label={`View image ${index + 1} of ${galleryImages.length}`}
                                            aria-current={
                                                isActive ? "true" : undefined
                                            }
                                        >
                                            <img
                                                src={getPostImageUrl(imagePath)}
                                                alt={`${alt} thumbnail ${
                                                    index + 1
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {canScrollThumbs && (
                            <button
                                type="button"
                                className={`product-gallery__thumb-nav${
                                    isHorizontalThumbs
                                        ? " product-gallery__thumb-nav--next"
                                        : " product-gallery__thumb-nav--down"
                                }${showThumbNext ? "" : " is-disabled"}`}
                                onClick={() => scrollThumbs(1)}
                                disabled={!showThumbNext}
                                aria-label="Show more thumbnails"
                            >
                                {isHorizontalThumbs ? (
                                    <FiChevronRight />
                                ) : (
                                    <FiChevronDown />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="product-gallery__main-wrap">
                    <div className="product-gallery__main">
                        <img
                            key={activeImageUrl}
                            src={activeImageUrl}
                            alt={alt}
                            className="product-gallery__main-image"
                        />

                        {hasMultiple && (
                            <>
                                <button
                                    type="button"
                                    className="product-gallery__nav product-gallery__nav--prev"
                                    onClick={goToPrevious}
                                    aria-label="Previous image"
                                >
                                    <FiChevronLeft />
                                </button>

                                <button
                                    type="button"
                                    className="product-gallery__nav product-gallery__nav--next"
                                    onClick={goToNext}
                                    aria-label="Next image"
                                >
                                    <FiChevronRight />
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            className="product-gallery__expand"
                            onClick={() => setPreviewOpen(true)}
                            aria-label="Open image preview"
                        >
                            <FiMaximize2 />
                        </button>

                        {hasMultiple && (
                            <span className="product-gallery__counter">
                                {activeIndex + 1} / {galleryImages.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {previewOpen && (
                <div
                    className="product-gallery-preview"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product image preview"
                    onClick={() => setPreviewOpen(false)}
                >
                    <button
                        type="button"
                        className="product-gallery-preview__close"
                        onClick={() => setPreviewOpen(false)}
                        aria-label="Close preview"
                    >
                        <FiX />
                    </button>

                    {hasMultiple && (
                        <>
                            <button
                                type="button"
                                className="product-gallery-preview__nav product-gallery-preview__nav--prev"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    goToPrevious();
                                }}
                                aria-label="Previous image"
                            >
                                <FiChevronLeft />
                            </button>

                            <button
                                type="button"
                                className="product-gallery-preview__nav product-gallery-preview__nav--next"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    goToNext();
                                }}
                                aria-label="Next image"
                            >
                                <FiChevronRight />
                            </button>
                        </>
                    )}

                    <div
                        className="product-gallery-preview__content"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img
                            src={activeImageUrl}
                            alt={alt}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default ProductImageGallery;
