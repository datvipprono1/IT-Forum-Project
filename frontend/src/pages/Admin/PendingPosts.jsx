import { useEffect, useState } from "react";
import { approvePost, getPendingPosts, rejectPost } from "../../api/adminApi";
import DeletePostModal from "../../components/post/DeletePostModal";
import formatDate from "../../utils/formatDate";

function PendingPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectingPost, setRejectingPost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPendingPosts() {
      try {
        setLoading(true);
        const response = await getPendingPosts();

        if (isMounted) {
          setPosts(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được bài chờ duyệt.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPendingPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprove = async (postId) => {
    try {
      const response = await approvePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setSuccess(response.data.message);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể phê duyệt bài viết.");
    }
  };

  const handleRejectRequest = (post) => {
    setRejectTarget(post);
  };

  const handleConfirmReject = async (payload) => {
    if (!rejectTarget) {
      return;
    }

    setRejectingPost(true);

    try {
      const response = await rejectPost(rejectTarget.id, payload);
      setPosts((current) => current.filter((post) => post.id !== rejectTarget.id));
      setSuccess(response.data.message);
      setError("");
      setRejectTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể từ chối bài viết.");
    } finally {
      setRejectingPost(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Hàng chờ kiểm duyệt</p>
          <h2>Chỉ các bài bị hệ thống đánh dấu mới xuất hiện ở đây</h2>
        </div>
        <span className="section-heading__note">Admin xem lý do trước khi quyết định</span>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      {loading ? <div className="panel empty-state">Đang tải bài chờ duyệt...</div> : null}

      {!loading && !posts.length ? <div className="panel empty-state">Không có bài viết nào đang chờ duyệt.</div> : null}

      {!loading && posts.length ? (
        <div className="board-grid">
          {posts.map((post) => (
            <article key={post.id} className="panel moderation-card">
              <span className="status-pill status-pill--warning">Chờ duyệt</span>
              <h3>{post.title}</h3>
              <p className="moderation-card__meta">
                {post.author} • {post.category} • {formatDate(post.createdAt)}
              </p>
              <p>{post.summary}</p>
              {post.moderationReasons?.length ? (
                <div className="tag-cloud">
                  {post.moderationReasons.map((reason) => (
                    <span key={reason} className="tag">
                      {reason}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="action-row">
                <button type="button" className="outline-button compact" onClick={() => handleApprove(post.id)}>
                  Phê duyệt
                </button>
                <button type="button" className="ghost-button compact danger" onClick={() => handleRejectRequest(post)}>
                  Từ chối
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <DeletePostModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleConfirmReject}
        submitting={rejectingPost}
        title="Từ chối và xóa bài viết"
        confirmLabel="Xác nhận từ chối"
        targetLabel={rejectTarget ? `bài viết "${rejectTarget.title}"` : "bài viết này"}
      />
    </section>
  );
}

export default PendingPosts;
