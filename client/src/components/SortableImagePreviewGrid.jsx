import { useState } from "react";
import { FiMove, FiPlus, FiX } from "react-icons/fi";

const MAX_IMAGES = 10;

function SortableImagePreviewGrid({
    items = [],
    onReorder,
    onRemove,
    onAddMore,
    maxItems = MAX_IMAGES,
    disabled = false,
}) {
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    if (!items.length) return null;

    const reorderItems = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex === null) return;

        const nextItems = [...items];
        const [movedItem] = nextItems.splice(fromIndex, 1);
        nextItems.splice(toIndex, 0, movedItem);
        onReorder(nextItems);
    };

    return (
        <div className="image-preview-grid">
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={`image-preview-item${
                        index === 0 ? " is-cover" : ""
                    }${dragIndex === index ? " is-dragging" : ""}${
                        dragOverIndex === index && dragIndex !== index
                            ? " is-drag-over"
                            : ""
                    }`}
                    draggable={!disabled}
                    onDragStart={() => {
                        if (disabled) return;
                        setDragIndex(index);
                    }}
                    onDragEnd={() => {
                        setDragIndex(null);
                        setDragOverIndex(null);
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        if (disabled || dragIndex === null) return;
                        setDragOverIndex(index);
                    }}
                    onDragLeave={() => {
                        setDragOverIndex((current) =>
                            current === index ? null : current
                        );
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        if (disabled) return;
                        reorderItems(dragIndex, index);
                        setDragIndex(null);
                        setDragOverIndex(null);
                    }}
                >
                    <img src={item.preview} alt={`Product preview ${index + 1}`} />

                    {index === 0 && (
                        <span className="image-preview-cover">Cover</span>
                    )}

                    <span className="image-preview-drag" aria-hidden="true">
                        <FiMove />
                    </span>

                    <button
                        type="button"
                        className="image-preview-remove"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemove?.(item.id);
                        }}
                        disabled={disabled || items.length <= 1}
                        aria-label={`Remove image ${index + 1}`}
                        title={
                            items.length <= 1
                                ? "Keep at least one image"
                                : "Remove image"
                        }
                    >
                        <FiX />
                    </button>
                </div>
            ))}

            {onAddMore && items.length < maxItems && (
                <button
                    type="button"
                    className="image-preview-add"
                    onClick={onAddMore}
                    disabled={disabled}
                    aria-label="Add more images"
                >
                    <FiPlus />
                    <span>Add image</span>
                </button>
            )}
        </div>
    );
}

export default SortableImagePreviewGrid;
