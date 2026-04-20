import { useEffect, useState } from "react";
import { createCategory, getPendingPosts, getReports, getStatistics } from "../../api/adminApi";
import formatDate from "../../utils/formatDate";
import { getReportStatusLabel, getSeverityLabel } from "../../utils/labels";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsResponse, pendingResponse, reportsResponse] = await Promise.all([
          getStatistics(),
          getPendingPosts(),
          getReports(),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(statsResponse.data);
        setPendingPosts(pendingResponse.data);
        setReports(reportsResponse.data);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được dữ liệu dashboard.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!categoryName.trim()) {
      setError("Bạn cần nhập tên chủ đề.");
      return;
    }

    try {
      const response = await createCategory(categoryName.trim());
      setSuccess(`Đã tạo hoặc cập nhật chủ đề: ${response.data.category.name}`);
      setCategoryName("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tạo chủ đề.");
    }
  };

  return (
    <section className="page-stack">
      {false ? (
        <div className="hero-panel admin-hero">
        <div className="hero-panel__content">
          <p className="eyebrow">Bảng điều khiển admin</p>
          <h2>Dashboard này đang lấy số liệu thật từ backend file-store và Firebase Auth.</h2>
          <p>
            Bạn có thể theo dõi tài khoản, số bài chờ duyệt, report vi phạm và tạo chủ đề mới ngay trên cùng một màn hình.
          </p>
        </div>
        </div>
      ) : null}

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      {loading ? <div className="panel empty-state">Đang tải dashboard...</div> : null}

      {!loading && stats ? (
        <>
          <div className="stat-grid">
            <div className="panel stat-card">
              <span>{stats.totalUsers}</span>
              <strong>Tổng số user</strong>
              <p>Số lượng hồ sơ hiện có trong hệ thống</p>
            </div>
            <div className="panel stat-card">
              <span>{stats.pendingPosts}</span>
              <strong>Bài chờ duyệt</strong>
              <p>Cần admin xem trước khi lên bảng tin</p>
            </div>
            <div className="panel stat-card">
              <span>{stats.totalReports}</span>
              <strong>Report</strong>
              <p>Tổng số báo cáo đã ghi nhận</p>
            </div>
            <div className="panel stat-card">
              <span>{stats.lockedUsers}</span>
              <strong>Tài khoản khóa</strong>
              <p>Người dùng đang bị chặn truy cập</p>
            </div>
          </div>

          <div className="content-grid">
            <div className="stack">
              <div className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Hàng chờ duyệt</p>
                    <h3>Cần xử lý ngay</h3>
                  </div>
                </div>
                <div className="list-block">
                  {pendingPosts.length ? (
                    pendingPosts.slice(0, 4).map((post) => (
                      <div key={post.id} className="list-block__item">
                        <div>
                          <strong>{post.title}</strong>
                          <p>
                            {post.author} • {post.category}
                          </p>
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">Không có bài viết nào đang chờ duyệt.</div>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Report mới</p>
                    <h3>Ưu tiên mức độ cao</h3>
                  </div>
                </div>
                <div className="list-block">
                  {reports.length ? (
                    reports.slice(0, 4).map((report) => (
                      <div key={report.id} className="list-block__item">
                        <div>
                          <strong>{report.title}</strong>
                          <p>
                            {report.reason} • {getReportStatusLabel(report.status)}
                          </p>
                        </div>
                        <span className={`severity-pill severity-pill--${report.severity}`}>
                          {getSeverityLabel(report.severity)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">Chưa có report nào trong hệ thống.</div>
                  )}
                </div>
              </div>
            </div>

            <aside className="aside-stack">
              <form className="panel form-panel" onSubmit={handleCreateCategory}>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Chủ đề</p>
                    <h3>Tạo chủ đề mới</h3>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="category-name">Tên chủ đề</label>
                  <input
                    id="category-name"
                    className="text-input"
                    type="text"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="Ví dụ: Thực tập doanh nghiệp"
                  />
                </div>
                <button type="submit" className="primary-button full-width">
                  Tạo chủ đề
                </button>
              </form>

              <div className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Chính sách</p>
                    <h3>Ưu tiên kiểm duyệt</h3>
                  </div>
                </div>
                <ul className="clean-list">
                  <li>Report mức độ cao cần được xử lý trước.</li>
                  <li>Bài chờ duyệt quá lâu nên được xem lại trong ngày.</li>
                  <li>Tài khoản vi phạm lặp lại có thể bị khóa ngay từ trang report.</li>
                </ul>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default Dashboard;
