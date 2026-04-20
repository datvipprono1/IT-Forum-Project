import { useEffect, useState } from "react";
import { postDeletionReasons } from "../../constants/postDeletionReasons";

function DeletePostModal({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  title = "Xóa bài viết",
  confirmLabel = "Xác nhận xóa",
  targetLabel = "bài viết này",
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [violationTerms, setViolationTerms] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedReason("");
      setViolationTerms("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Bạn phải chọn một lý do trước khi xóa.");
      return;
    }

    setError("");
    await onSubmit({
      deletionReason: selectedReason,
      violationTerms,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Xử lý nội dung</p>
            <h3>{title}</h3>
          </div>
          <span className="status-pill status-pill--warning">Bắt buộc chọn lý do</span>
        </div>

        <p className="modal__description">
          Admin chỉ được xóa {targetLabel} sau khi chọn một nguyên nhân cụ thể để phục vụ kiểm duyệt nội dung.
        </p>

        <div className="option-list option-list--column">
          {postDeletionReasons.map((reason) => (
            <label key={reason} className={selectedReason === reason ? "option-chip is-active" : "option-chip"}>
              <input
                type="radio"
                name="delete-post-reason"
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>

        <div className="field">
          <label htmlFor="violationTerms">Từ ngữ vi phạm</label>
          <textarea
            id="violationTerms"
            className="text-area short"
            placeholder="Nhập từ hoặc cụm từ mới cần thêm vào bộ lọc, ngăn cách bằng dấu phẩy hoặc xuống dòng"
            value={violationTerms}
            onChange={(event) => setViolationTerms(event.target.value)}
          />
          <span className="section-heading__note">
            Nếu bạn nhập từ mới ở đây, hệ thống sẽ ghi nhận đó là từ vi phạm và dùng nó cho các lần kiểm duyệt sau.
          </span>
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="modal__actions">
          <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button type="button" className="ghost-button danger" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletePostModal;
