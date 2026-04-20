import { useEffect, useState } from "react";
import { getReports, toggleUserStatus, updateReportStatus } from "../../api/adminApi";
import { deleteComment, deletePost } from "../../api/postApi";
import DeletePostModal from "../../components/post/DeletePostModal";
import formatDate from "../../utils/formatDate";
import { getReportStatusLabel, getSeverityLabel, getUserStatusLabel } from "../../utils/labels";

function ManageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingContent, setDeletingContent] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        const response = await getReports();

        if (isMounted) {
          setReports(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được danh sách report.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const replaceReport = (updatedReport) => {
    setReports((current) => current.map((report) => (report.id === updatedReport.id ? updatedReport : report)));
  };

  const handleUpdateStatus = async (reportId, status) => {
    try {
      const response = await updateReportStatus(reportId, status);
      replaceReport(response.data.report);
      setSuccess(response.data.message);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật trạng thái report.");
    }
  };

  const handleDeleteContent = async (report) => {
    if (report.targetType === "post") {
      setDeleteTarget(report);
      return;
    }

    if (!window.confirm("Xóa nội dung đang bị report?")) {
      return;
    }

    try {
      await deleteComment(report.targetId);
      setReports((current) =>
        current.filter(
          (item) => !(item.targetType === report.targetType && item.targetId === report.targetId)
        )
      );
      setSuccess("Đã xóa nội dung vi phạm.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa nội dung vi phạm.");
    }
  };

  const handleConfirmDeletePost = async (payload) => {
    if (!deleteTarget) {
      return;
    }

    setDeletingContent(true);

    try {
      await deletePost(deleteTarget.targetId, payload);
      setReports((current) =>
        current.filter(
          (item) => !(item.targetType === deleteTarget.targetType && item.targetId === deleteTarget.targetId)
        )
      );
      setSuccess("Đã xóa nội dung vi phạm.");
      setError("");
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa nội dung vi phạm.");
    } finally {
      setDeletingContent(false);
    }
  };

  const handleToggleUser = async (report) => {
    if (!report.ownerId) {
      setError("Report này không xác định được chủ sở hữu nội dung.");
      return;
    }

    try {
      const response = await toggleUserStatus(report.ownerId);
      setReports((current) =>
        current.map((item) =>
          item.ownerId === report.ownerId ? { ...item, ownerStatus: response.data.user.status } : item
        )
      );
      setSuccess(response.data.message);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Báo cáo vi phạm</p>
          <h2>Danh sách report cần xử lý</h2>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      {loading ? <div className="panel empty-state">Đang tải report...</div> : null}

      {!loading && !reports.length ? <div className="panel empty-state">Chưa có report nào cần xử lý.</div> : null}

      {!loading && reports.length ? (
        <div className="stack">
          {reports.map((report) => (
            <article key={report.id} className="panel report-case">
              <div className="report-case__header">
                <div>
                  <p className="eyebrow">
                    {report.id} • {report.targetType === "post" ? "Bài viết" : "Bình luận"}
                  </p>
                  <h3>{report.title}</h3>
                </div>
                <span className={`severity-pill severity-pill--${report.severity}`}>
                  {getSeverityLabel(report.severity)}
                </span>
              </div>

              <div className="report-case__body">
                <div className="detail-list">
                  <div className="detail-list__row">
                    <span>Người báo cáo</span>
                    <strong>{report.reporter}</strong>
                  </div>
                  <div className="detail-list__row">
                    <span>Chủ nội dung</span>
                    <strong>{report.ownerName}</strong>
                  </div>
                  <div className="detail-list__row">
                    <span>Lý do</span>
                    <strong>{report.reason}</strong>
                  </div>
                  <div className="detail-list__row">
                    <span>Trạng thái</span>
                    <strong>{getReportStatusLabel(report.status)}</strong>
                  </div>
                  <div className="detail-list__row">
                    <span>Tài khoản chủ nội dung</span>
                    <strong>{getUserStatusLabel(report.ownerStatus)}</strong>
                  </div>
                  <div className="detail-list__row">
                    <span>Thời điểm</span>
                    <strong>{formatDate(report.createdAt)}</strong>
                  </div>
                </div>
              </div>

              <p>{report.note || report.preview || "Không có ghi chú bổ sung."}</p>

              <div className="action-row">
                <button type="button" className="outline-button compact" onClick={() => handleUpdateStatus(report.id, "reviewed")}>
                  Đánh dấu đã xem
                </button>
                <button type="button" className="ghost-button compact" onClick={() => handleDeleteContent(report)}>
                  Xóa nội dung
                </button>
                <button type="button" className="ghost-button compact danger" onClick={() => handleToggleUser(report)}>
                  {report.ownerStatus === "locked" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                </button>
                <button type="button" className="primary-button compact" onClick={() => handleUpdateStatus(report.id, "resolved")}>
                  Đánh dấu đã xử lý
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <DeletePostModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleConfirmDeletePost}
        submitting={deletingContent}
        title="Xóa bài viết bị report"
        confirmLabel="Xác nhận xóa bài"
        targetLabel={deleteTarget ? `bài viết "${deleteTarget.title}"` : "bài viết này"}
      />
    </section>
  );
}

export default ManageReports;
