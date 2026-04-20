import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPublicProfile } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import formatDate from "../../utils/formatDate";
import { getRoleLabel } from "../../utils/labels";
import { resolveMediaUrl } from "../../utils/media";

function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const response = await getPublicProfile(id);

        if (!isMounted) {
          return;
        }

        setProfile(response.data);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được hồ sơ người dùng.");
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
  }, [id]);

  if (loading) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">Đang tải hồ sơ người dùng...</div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">{error || "Không tìm thấy hồ sơ người dùng."}</div>
      </section>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <section className="page-stack">
      <div className="panel profile-banner">
        <div className="profile-banner__identity">
          <div className="profile-banner__avatar">{profile.avatar}</div>
          <div>
            <p className="eyebrow">{isOwnProfile ? "Trang cá nhân công khai của bạn" : "Trang cá nhân công khai"}</p>
            <h2>{profile.fullName}</h2>
            <p>{profile.bio || "Người dùng này chưa thêm mô tả cá nhân."}</p>
          </div>
        </div>

        <div className="profile-banner__stats">
          <div className="mini-stat">
            <strong>{profile.stats?.approvedPosts || 0}</strong>
            <span>Bài công khai</span>
          </div>
          <div className="mini-stat">
            <strong>{profile.studentId || "--"}</strong>
            <span>MSSV / Mã số</span>
          </div>
          <div className="mini-stat">
            <strong>{getRoleLabel(profile.role)}</strong>
            <span>Vai trò</span>
          </div>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="content-grid">
        <div className="stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Thông tin người dùng</p>
                <h3>Hồ sơ cơ bản</h3>
              </div>
              {isOwnProfile ? (
                <button type="button" className="outline-button compact" onClick={() => navigate("/profile")}>
                  Chỉnh sửa hồ sơ của tôi
                </button>
              ) : null}
            </div>

            <div className="detail-list">
              <div className="detail-list__row">
                <span>Họ tên</span>
                <strong>{profile.fullName}</strong>
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
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bài viết công khai</p>
                <h3>{isOwnProfile ? "Những bài viết đang hiển thị của bạn" : `Bài viết của ${profile.fullName}`}</h3>
              </div>
            </div>

            <div className="stack">
              {profile.authoredPosts?.length ? (
                profile.authoredPosts.map((post) => {
                  const imageSrc = resolveMediaUrl(post.imageUrl);

                  return (
                    <article key={post.id} className="panel profile-post-card">
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">{post.category}</p>
                          <h3>{post.title}</h3>
                        </div>
                        <span className="section-heading__note">{formatDate(post.createdAt)}</span>
                      </div>

                      <p className="post-card__excerpt">{post.summary}</p>

                      {imageSrc ? (
                        <div className="post-card__visual post-card__visual--image">
                          <img src={imageSrc} alt={post.title} className="post-card__image" />
                        </div>
                      ) : null}

                      <div className="post-card__meta">
                        <span>{post.likes} lượt thích</span>
                        <span>{post.commentsCount} bình luận</span>
                        <span>{post.saves} lượt lưu</span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">Người dùng này chưa có bài viết công khai nào.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="aside-stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Điều hướng nhanh</p>
                <h3>Tiếp tục khám phá</h3>
              </div>
            </div>
            <div className="stack">
              <button type="button" className="outline-button full-width" onClick={() => navigate("/home")}>
                Quay lại bảng tin
              </button>
              {isOwnProfile ? (
                <button type="button" className="ghost-button full-width" onClick={() => navigate("/create-post")}>
                  Tạo bài viết mới
                </button>
              ) : (
                <button type="button" className="ghost-button full-width" onClick={() => navigate("/profile")}>
                  Xem hồ sơ của tôi
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default UserProfile;
