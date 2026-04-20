import { useEffect, useState } from "react";
import { createUser, getUsers, toggleUserStatus } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import formatDate from "../../utils/formatDate";
import { getRoleLabel, getUserStatusLabel } from "../../utils/labels";

const initialForm = {
  fullName: "",
  studentId: "",
  email: "",
  role: "student",
  faculty: "Khoa Công nghệ",
  bio: "",
};

function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await getUsers();

        if (isMounted) {
          setUsers(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được danh sách user.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.fullName.trim()) {
      setError("Bạn cần nhập họ tên.");
      return;
    }

    if (!formData.studentId.trim() && !formData.email.trim()) {
      setError("Bạn cần nhập MSSV hoặc email.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await createUser({
        ...formData,
        fullName: formData.fullName.trim(),
        studentId: formData.studentId.trim(),
        email: formData.email.trim(),
        faculty: formData.faculty.trim(),
        bio: formData.bio.trim(),
      });

      setUsers((current) => {
        const exists = current.some((user) => user.id === response.data.user.id);
        return exists
          ? current.map((user) => (user.id === response.data.user.id ? response.data.user : user))
          : [response.data.user, ...current];
      });
      setFormData(initialForm);
      setSuccess(
        `Đã tạo tài khoản ${response.data.user.email}. Mật khẩu mặc định: ${response.data.defaultPassword}`
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tạo tài khoản.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    setError("");
    setSuccess("");

    try {
      const response = await toggleUserStatus(userId);
      setUsers((current) => current.map((user) => (user.id === userId ? response.data.user : user)));
      setSuccess(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quản lý tài khoản</p>
          <h2>Admin tạo tài khoản và quản lý trạng thái truy cập</h2>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <div className="content-grid">
        <form className="panel form-panel" onSubmit={handleCreateUser}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tạo tài khoản mới</p>
              <h3>Sinh viên, giảng viên hoặc admin</h3>
            </div>
          </div>

          <div className="field">
            <label htmlFor="fullName">Họ tên</label>
            <input
              id="fullName"
              name="fullName"
              className="text-input"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="studentId">MSSV / Mã số</label>
            <input
              id="studentId"
              name="studentId"
              className="text-input"
              type="text"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Nếu nhập, email sẽ tự suy ra dạng mssv@dntu.edu.vn"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email tùy chọn</label>
            <input
              id="email"
              name="email"
              className="text-input"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Dùng cho admin hoặc giảng viên nếu không có MSSV"
            />
          </div>

          <div className="field">
            <label htmlFor="role">Vai trò</label>
            <select id="role" name="role" className="select-input" value={formData.role} onChange={handleChange}>
              <option value="student">Sinh viên</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="faculty">Khoa / Bộ môn</label>
            <input
              id="faculty"
              name="faculty"
              className="text-input"
              type="text"
              value={formData.faculty}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="bio">Mô tả ngắn</label>
            <textarea
              id="bio"
              name="bio"
              className="text-area"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Thông tin này sẽ hiện ở trang cá nhân khi user đăng nhập"
            />
          </div>

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="panel admin-table">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Danh sách tài khoản</p>
              <h3>Đồng bộ với dữ liệu profile hiện tại</h3>
            </div>
          </div>

          {loading ? <div className="empty-state">Đang tải danh sách user...</div> : null}

          {!loading && !users.length ? <div className="empty-state">Chưa có tài khoản nào.</div> : null}

          {!loading
            ? users.map((user) => (
                <div key={user.id} className="admin-table__row">
                  <div className="admin-table__identity">
                    <div className="avatar-badge">{user.avatar || user.fullName.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{user.fullName}</strong>
                      <p>
                        {getRoleLabel(user.role)} • {user.faculty || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="admin-table__meta">
                    <span>{user.email}</span>
                    <span>{user.postsCount} bài viết</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>

                  <span className={user.status === "locked" ? "status-pill status-pill--danger" : "status-pill"}>
                    {getUserStatusLabel(user.status)}
                  </span>

                  <div className="admin-table__actions">
                    <span>{user.studentId || "Không có MSSV"}</span>
                    <button
                      type="button"
                      className={user.status === "locked" ? "primary-button compact" : "ghost-button compact danger"}
                      onClick={() => handleToggleStatus(user.id)}
                      disabled={user.id === currentUser?.id}
                    >
                      {user.status === "locked" ? "Mở khóa" : "Khóa tài khoản"}
                    </button>
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}

export default ManageUsers;
