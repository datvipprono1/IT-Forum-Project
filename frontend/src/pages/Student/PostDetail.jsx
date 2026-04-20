import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  commentPost,
  deleteComment,
  deletePost,
  getPostDetail,
  likePost,
  reportComment,
  reportPost,
  savePost,
} from "../../api/postApi";
import CommentItem from "../../components/post/CommentItem";
import DeletePostModal from "../../components/post/DeletePostModal";
import ReportModal from "../../components/post/ReportModal";
import { useAuth } from "../../context/AuthContext";
import formatDate from "../../utils/formatDate";
import { getRoleLabel } from "../../utils/labels";
import { resolveMediaUrl } from "../../utils/media";

function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");
        const response = await getPostDetail(id);

        if (isMounted) {
          setPost(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được bài viết.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const mergePostSummary = (summary) => {
    setPost((current) =>
      current
        ? {
            ...current,
            ...summary,
            comments: current.comments,
          }
        : current
    );
  };

  const handleLike = async () => {
    try {
      const response = await likePost(post.id);
      mergePostSummary(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể thích bài viết.");
    }
  };

  const handleSave = async () => {
    try {
      const response = await savePost(post.id);
      mergePostSummary(response.data);
      setNotice(response.data.savedBy?.includes(user.id) ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể lưu bài viết.");
    }
  };

  const handleShare = async () => {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Đã sao chép link bài viết.");
    } catch {
      setNotice(link);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) {
      setError("Bạn cần nhập nội dung bình luận.");
      return;
    }

    setSubmittingComment(true);
    setError("");

    try {
      const response = await commentPost(post.id, { content: commentContent });
      setPost((current) => ({
        ...current,
        comments: [...current.comments, response.data],
        commentsCount: current.commentsCount + 1,
      }));
      setCommentContent("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể gửi bình luận.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Xóa bình luận này?")) {
      return;
    }

    try {
      await deleteComment(commentId);
      setPost((current) => ({
        ...current,
        comments: current.comments.filter((comment) => comment.id !== commentId),
        commentsCount: Math.max(0, current.commentsCount - 1),
      }));
      setNotice("Đã xóa bình luận.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa bình luận.");
    }
  };

  const performDeletePost = async (payload = {}) => {
    try {
      await deletePost(post.id, payload);
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa bài viết.");
    }
  };

  const handleDeletePost = async () => {
    if (isAdmin) {
      setDeleteModalOpen(true);
      return;
    }

    if (!window.confirm("Xóa bài viết này?")) {
      return;
    }

    await performDeletePost();
  };

  const handleConfirmAdminDelete = async (payload) => {
    setDeletingPost(true);

    try {
      await performDeletePost(payload);
      setDeleteModalOpen(false);
    } finally {
      setDeletingPost(false);
    }
  };

  const handleSubmitReport = async (payload) => {
    if (!reportTarget) {
      return;
    }

    setReporting(true);

    try {
      if (reportTarget.type === "post") {
        await reportPost(reportTarget.id, payload);
      } else {
        await reportComment(reportTarget.id, payload);
      }

      setNotice("Đã gửi report tới admin.");
      setReportTarget(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể gửi report.");
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">Đang tải bài viết...</div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="page-stack">
        <div className="panel empty-state">{error || "Không tìm thấy bài viết."}</div>
      </section>
    );
  }

  const canManagePost = isAdmin || user.id === post.authorId;
  const imageSrc = resolveMediaUrl(post.imageUrl);

  return (
    <section className="page-stack">
      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div className="content-grid">
        <div className="stack">
          <article className="panel detail-article">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{post.category}</p>
                <h2>{post.title}</h2>
                <p className="post-card__excerpt">{post.summary}</p>
              </div>
              <span className="section-heading__note">{formatDate(post.createdAt)}</span>
            </div>

            <div className="detail-article__meta">
              <span>{post.author}</span>
              <span>{getRoleLabel(post.authorRole)}</span>
              {post.authorFaculty ? <span>{post.authorFaculty}</span> : null}
            </div>

            {imageSrc ? (
              <div className="detail-article__media">
                <img src={imageSrc} alt={post.title} className="detail-article__image" />
              </div>
            ) : null}

            <div className="action-row">
              <button
                type="button"
                className={post.likedBy?.includes(user.id) ? "primary-button" : "ghost-button"}
                onClick={handleLike}
              >
                {post.likedBy?.includes(user.id) ? "Đã thích" : "Thích bài viết"}
              </button>
              <button
                type="button"
                className={post.savedBy?.includes(user.id) ? "outline-button" : "ghost-button"}
                onClick={handleSave}
              >
                {post.savedBy?.includes(user.id) ? "Đã lưu" : "Lưu bài viết"}
              </button>
              <button type="button" className="ghost-button" onClick={handleShare}>
                Sao chép link
              </button>
              <button
                type="button"
                className="ghost-button danger"
                onClick={() => setReportTarget({ type: "post", id: post.id, label: "bài viết này" })}
              >
                Báo cáo
              </button>
              {canManagePost ? (
                <>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => navigate(`/create-post?edit=${post.id}`)}
                  >
                    Chỉnh sửa
                  </button>
                  <button type="button" className="ghost-button danger" onClick={handleDeletePost}>
                    Xóa bài viết
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Bình luận</p>
                <h3>Trao đổi dưới bài viết</h3>
              </div>
              <span className="section-heading__note">{post.commentsCount} phản hồi</span>
            </div>

            <div className="field">
              <label htmlFor="comment">Thêm bình luận</label>
              <textarea
                id="comment"
                className="text-area"
                placeholder="Nhập ý kiến để trao đổi về bài viết này"
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
              />
            </div>
            <button type="button" className="primary-button" onClick={handleComment} disabled={submittingComment}>
              {submittingComment ? "Đang gửi..." : "Gửi bình luận"}
            </button>

            <div className="comment-thread">
              {post.comments.length ? (
                post.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    canDelete={isAdmin || comment.authorId === user.id}
                    onDelete={() => handleDeleteComment(comment.id)}
                    onReport={() => setReportTarget({ type: "comment", id: comment.id, label: "bình luận này" })}
                  />
                ))
              ) : (
                <div className="empty-state">Chưa có bình luận nào.</div>
              )}
            </div>
          </section>
        </div>

        <aside className="aside-stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Thông số</p>
                <h3>Mức độ tương tác</h3>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-chip">
                <strong>{post.likes}</strong>
                <span>Lượt thích</span>
              </div>
              <div className="info-chip">
                <strong>{post.commentsCount}</strong>
                <span>Bình luận</span>
              </div>
              <div className="info-chip">
                <strong>{post.saves}</strong>
                <span>Lượt lưu</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gợi ý report</p>
                <h3>Khi nào nên báo cáo</h3>
              </div>
            </div>
            <ul className="clean-list">
              <li>Nội dung xúc phạm, công kích hoặc gây hấn.</li>
              <li>Spam, quảng cáo hoặc chèn link không phù hợp.</li>
              <li>Nội dung lệch mục đích học tập của diễn đàn.</li>
            </ul>
          </div>
        </aside>
      </div>

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
        submitting={reporting}
        targetLabel={reportTarget?.label}
      />

      <DeletePostModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSubmit={handleConfirmAdminDelete}
        submitting={deletingPost}
        title="Xóa bài viết khỏi diễn đàn"
        confirmLabel="Xác nhận xóa bài"
        targetLabel={`bài viết "${post.title}"`}
      />
    </section>
  );
}

export default PostDetail;
