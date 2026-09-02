function DeleteConfirmModal({
  isOpen,//Controls whether the modal is visible
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="delete-modal">

        <h2>Delete Post</h2>

        <p>
          Are you sure you want to delete this post?
        </p>

        <div className="modal-buttons">

          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default DeleteConfirmModal;
