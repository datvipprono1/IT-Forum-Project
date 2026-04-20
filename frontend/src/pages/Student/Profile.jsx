import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/authApi";
import { deletePost } from "../../api/postApi";
import DeletePostModal from "../../components/post/DeletePostModal";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/userApi";
import formatDate from "../../utils/formatDate";
import { getPostStatusLabel, getRoleLabel } from "../../utils/labels";

function ProfilePageIcon() {
  return (
    <span className="profile-banner__page-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="presentation">
        <circle cx="12" cy="7.25" r="4.25" />
        <path d="M4.5 19a7.5 7.5 0 0 1 15 0" />
        <path d="M15.75 15.75h3.75" />
      </svg>
    </span>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { refreshProfile, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    faculty: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const response = await getProfile();

        if (!isMounted) {
          return;
        }

        setProfile(response.data);
        setProfileForm({
          fullName: response.data.fullName || "",
          faculty: response.data.faculty || "",
          bio: response.data.bio || "",
        });
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được hồ sơ cá nhân.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocalProfile = async () => {
    const response = await getProfile();
    setProfile(response.data);
    return response.data;
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);

    try {
      await updateProfile(profileForm);
      const latestProfile = await refreshProfile();
      setProfile(latestProfile);
      setProfileForm({
        fullName: latestProfile.fullName || "",
        faculty: latestProfile.faculty || "",
        bio: latestProfile.bio || "",
      });
      setSuccess("Đã cập nhật thông tin cá nhân.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Bạn cần nhập mật khẩu hiện tại và mật khẩu mới.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await changePassword(passwordForm);
      setSuccess(response.data.message || "Đổi mật khẩu thành công.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  const performDeletePost = async (postId, payload = {}) => {
    try {
      await deletePost(postId, payload);
      await refreshLocalProfile();
      setSuccess("Đã xóa bài viết.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa bài viết.");
    }
  };

  const handleDeletePost = async (post) => {
    if (isAdmin) {
      setDeleteTarget(post);
      return;
    }

    if (!window.confirm("Xóa bài viết này?")) {
      return;
    }

    await performDeletePost(post.id);
  };

  const handleConfirmAdminDelete = async (payload) => {
    if (!deleteTarget) {
      return;
    }

    setDeletingPost(true);

    try {
      await performDeletePost(deleteTarget.id, payload);
      setDeleteTarget(null);
    } finally {
      setDeletingPost(false);
    }
  };

  if (loading) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">Đang tải hồ sơ cá nhân...</div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">Không tìm thấy hồ sơ người dùng.</div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="panel profile-banner">
        <div className="profile-banner__identity">
          <div className="profile-banner__avatar">{profile.avatar}</div>
          <div className="profile-banner__title-block">
            <div className="profile-banner__eyebrow">
              <ProfilePageIcon />
              <p className="eyebrow">Hồ sơ người dùng</p>
            </div>
            <h2>{profile.fullName}</h2>
            <p>{profile.bio || "Chưa có mô tả cá nhân."}</p>
          </div>
        </div>

        <div className="profile-banner__stats">
          <div className="mini-stat">
            <strong>{profile.stats?.approvedPosts || 0}</strong>
            <span>Bài công khai</span>
          </div>
          <div className="mini-stat">
            <strong>{profile.stats?.pendingPosts || 0}</strong>
            <span>Bài chờ duyệt</span>
          </div>
          <div className="mini-stat">
            <strong>{profile.stats?.savedPosts || 0}</strong>
            <span>Bài đã lưu</span>
          </div>
        </div>
      </div>

      {success ? <div className="form-success">{success}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div className="content-grid">
        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Thông tin cơ bản</p>
                <h3>Dữ liệu do admin tạo và bạn có thể cập nhật</h3>
              </div>
            </div>

            <div className="detail-list">
              <div className="detail-list__row">
                <span>Họ tên</span>
                <strong>{profile.fullName}</strong>
              </div>
              <div className="detail-list__row">
                <span>Email</span>
                <strong>{profile.email}</strong>
              </div>
              <div className="detail-list__row">
                <span>Vai trò</span>
                <strong>{getRoleLabel(profile.role)}</strong>
              </div>
              <div className="detail-list__row">
                <span>MSSV / Mã số</span>
                <strong>{profile.studentId || "Không áp dụng"}</strong>
              </div>
              <div className="detail-list__row">
                <span>Khoa / Bộ môn</span>
                <strong>{profile.faculty || "Chưa cập nhật"}</strong>
              </div>
              <div className="detail-list__row">
                <span>Trạng thái</span>
                <strong>{profile.status === "locked" ? "Đã khóa" : "Đang hoạt động"}</strong>
              </div>
            </div>
          </div>

          <form className="panel form-panel" onSubmit={handleUpdateProfile}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Chỉnh sửa hồ sơ</p>
                <h3>Cập nhật thông tin cá nhân</h3>
              </div>
            </div>

            <div className="field">
              <label htmlFor="fullName">Họ tên</label>
              <input
                id="fullName"
                name="fullName"
                className="text-input"
                type="text"
                value={profileForm.fullName}
                onChange={handleProfileChange}
              />
            </div>

            <div className="field">
              <label htmlFor="faculty">Khoa / Bộ môn</label>
              <input
                id="faculty"
                name="faculty"
                className="text-input"
                type="text"
                value={profileForm.faculty}
                onChange={handleProfileChange}
              />
            </div>

            <div className="field">
              <label htmlFor="bio">Giới thiệu ngắn</label>
              <textarea
                id="bio"
                name="bio"
                className="text-area"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Viết vài dòng để giới thiệu về bản thân"
              />
            </div>

            <button type="submit" className="primary-button" disabled={savingProfile}>
              {savingProfile ? "Đang cập nhật..." : "Lưu thông tin"}
            </button>
          </form>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bài viết của bạn</p>
                <h3>Theo dõi trạng thái đăng, chỉnh sửa và xóa</h3>
              </div>
            </div>

            <div className="saved-list">
              {profile.authoredPosts?.length ? (
                profile.authoredPosts.map((post) => (
                  <div key={post.id} className="saved-list__item">
                    <div>
                      <strong>{post.title}</strong>
                      <p>
                        {post.category} • {getPostStatusLabel(post.status)}
                      </p>
                      {post.status === "pending" && post.moderationReasons?.length ? (
                        <p>Lý do chờ duyệt: {post.moderationReasons.join(", ")}</p>
                      ) : null}
                    </div>
                    <div className="admin-table__actions">
                      <span>{formatDate(post.createdAt)}</span>
                      <button
                        type="button"
                        className="ghost-button compact"
                        onClick={() => navigate(`/create-post?edit=${post.id}`)}
                      >
                        Chỉnh sửa
                      </button>
                      <button type="button" className="ghost-button compact danger" onClick={() => handleDeletePost(post)}>
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Bạn chưa có bài viết nào.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="aside-stack">
          <form className="panel form-panel" onSubmit={handleChangePassword}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bảo mật</p>
                <h3>Đổi mật khẩu</h3>
              </div>
            </div>

            <div className="field">
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <input
                id="currentPassword"
                name="currentPassword"
                className="text-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="field">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                name="newPassword"
                className="text-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <button type="submit" className="primary-button full-width" disabled={changingPassword}>
              {changingPassword ? "Đang đổi mật khẩu..." : "Cập nhật mật khẩu"}
            </button>
          </form>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bài viết đã lưu</p>
                <h3>Danh sách để xem lại</h3>
              </div>
            </div>

            <div className="saved-list">
              {profile.savedPosts?.length ? (
                profile.savedPosts.map((post) => (
                  <div key={post.id} className="saved-list__item">
                    <div>
                      <strong>{post.title}</strong>
                      <p>{post.category}</p>
                    </div>
                    <button type="button" className="ghost-button compact" onClick={() => navigate("/home")}>
                      Mở bảng tin
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">Bạn chưa lưu bài viết nào.</div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <DeletePostModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleConfirmAdminDelete}
        submitting={deletingPost}
        title="Xóa bài viết khỏi hồ sơ"
        confirmLabel="Xác nhận xóa bài"
        targetLabel={deleteTarget ? `bài viết "${deleteTarget.title}"` : "bài viết này"}
      />
    </section>
  );
}

export default Profile;
