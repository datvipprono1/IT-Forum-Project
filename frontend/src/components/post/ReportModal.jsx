import { useEffect, useState } from "react";

const reportOptions = [
  { reason: "Ngôn từ xúc phạm", severity: "high" },
  { reason: "Sai mục đích học tập", severity: "medium" },
  { reason: "Spam / quảng cáo", severity: "medium" },
  { reason: "Thông tin không phù hợp", severity: "low" },
];

function ReportModal({ isOpen, onClose, onSubmit, submitting = false, targetLabel = "nội dung này" }) {
  const [selectedReason, setSelectedReason] = useState(reportOptions[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedReason(reportOptions[0]);
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    await onSubmit({
      reason: selectedReason.reason,
      severity: selectedReason.severity,
      note,
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
            <p className="eyebrow">Kiểm duyệt nội dung</p>
            <h3>Báo cáo {targetLabel}</h3>
          </div>
          <span className="status-pill status-pill--warning">Mô tả ngắn gọn, đúng vấn đề</span>
        </div>

        <div className="option-list">
          {reportOptions.map((option) => (
            <label
              key={option.reason}
              className={selectedReason.reason === option.reason ? "option-chip is-active" : "option-chip"}
            >
              <input
                type="radio"
                name="report-reason"
                checked={selectedReason.reason === option.reason}
                onChange={() => setSelectedReason(option)}
              />
              <span>{option.reason}</span>
            </label>
          ))}
        </div>

        <div className="field">
          <label htmlFor="reason">Ghi chú bổ sung</label>
          <textarea
            id="reason"
            className="text-area"
            placeholder="Nếu cần, mô tả ngắn gọn để admin xem xét nhanh hơn"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="modal__actions">
          <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button type="button" className="primary-button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
