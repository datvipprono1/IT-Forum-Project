import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  commentPost,
  deleteComment,
  deletePost,
  getPostDetail,
  getPosts,
  likePost,
  reportComment,
  reportPost,
  savePost,
} from "../../api/postApi";
import CommentItem from "../../components/post/CommentItem";
import DeletePostModal from "../../components/post/DeletePostModal";
import PostCard from "../../components/post/PostCard";
import ReportModal from "../../components/post/ReportModal";
import { useAuth } from "../../context/AuthContext";

const POSTS_PER_PAGE = 5;
const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: POSTS_PER_PAGE,
  hasPreviousPage: false,
  hasNextPage: false,
  from: 0,
  to: 0,
};

function mergeUniquePosts(currentPosts, incomingPosts) {
  const postMap = new Map(currentPosts.map((post) => [post.id, post]));

  incomingPosts.forEach((post) => {
    postMap.set(post.id, post);
  });

  return Array.from(postMap.values()).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const loadMoreRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loadedPages, setLoadedPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [postDetails, setPostDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState("");
  const [reportTarget, setReportTarget] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const pruneFeedState = (visibleIds) => {
    setPostDetails((current) => {
      const next = { ...current };

      Object.keys(next).forEach((postId) => {
        if (!visibleIds.has(postId)) {
          delete next[postId];
        }
      });

      return next;
    });
    setExpandedPosts((current) => {
      const next = { ...current };

      Object.keys(next).forEach((postId) => {
        if (!visibleIds.has(postId)) {
          delete next[postId];
        }
      });

      return next;
    });
    setCommentDrafts((current) => {
      const next = { ...current };

      Object.keys(next).forEach((postId) => {
        if (!visibleIds.has(postId)) {
          delete next[postId];
        }
      });

      return next;
    });
  };

  const loadFirstPage = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPosts({
        page: 1,
        limit: POSTS_PER_PAGE,
      });
      const items = response.data.items || [];
      const nextPagination = response.data.pagination || DEFAULT_PAGINATION;
      const visibleIds = new Set(items.map((post) => post.id));

      setPosts(items);
      setPagination(nextPagination);
      setLoadedPages(nextPagination.currentPage || 1);
      pruneFeedState(visibleIds);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được bảng tin.");
    } finally {
      setLoading(false);
    }
  };

  const reloadLoadedFeed = async () => {
    const pagesToReload = Math.max(1, loadedPages || 1);

    try {
      setLoading(true);
      setError("");
      let aggregatedPosts = [];
      let nextPagination = DEFAULT_PAGINATION;
      let lastLoadedPage = 1;

      for (let page = 1; page <= pagesToReload; page += 1) {
        const response = await getPosts({
          page,
          limit: POSTS_PER_PAGE,
        });
        const items = response.data.items || [];

        nextPagination = response.data.pagination || nextPagination;
        lastLoadedPage = nextPagination.currentPage || page;
        aggregatedPosts = mergeUniquePosts(aggregatedPosts, items);

        if (!nextPagination.hasNextPage) {
          break;
        }
      }

      const visibleIds = new Set(aggregatedPosts.map((post) => post.id));

      setPosts(aggregatedPosts);
      setPagination(nextPagination);
      setLoadedPages(lastLoadedPage);
      pruneFeedState(visibleIds);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể làm mới bảng tin.");
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loading || loadingMore || !pagination.hasNextPage) {
      return;
    }

    const nextPage = loadedPages + 1;

    try {
      setLoadingMore(true);
      const response = await getPosts({
        page: nextPage,
        limit: POSTS_PER_PAGE,
      });
      const incomingPosts = response.data.items || [];
      const nextPagination = response.data.pagination || DEFAULT_PAGINATION;

      setPosts((current) => mergeUniquePosts(current, incomingPosts));
      setPagination(nextPagination);
      setLoadedPages(nextPagination.currentPage || nextPage);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải thêm được bài viết.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirstPage();
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || loading || loadingMore || !pagination.hasNextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          loadMorePosts();
        }
      },
      {
        rootMargin: "260px 0px",
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [loading, loadingMore, pagination.hasNextPage, loadedPages]);

  const syncPostSummary = (updatedPost) => {
    setPosts((current) => current.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
    setPostDetails((current) => {
      if (!current[updatedPost.id]) {
        return current;
      }

      return {
        ...current,
        [updatedPost.id]: {
          ...current[updatedPost.id],
          ...updatedPost,
          comments: current[updatedPost.id].comments || [],
        },
      };
    });
  };

  const loadPostDetail = async (postId, forceReload = false) => {
    if (!forceReload && postDetails[postId]) {
      return postDetails[postId];
    }

    setLoadingDetails((current) => ({ ...current, [postId]: true }));
    setDetailErrors((current) => ({ ...current, [postId]: "" }));

    try {
      const response = await getPostDetail(postId);
      const detail = response.data;

      setPostDetails((current) => ({
        ...current,
        [postId]: detail,
      }));
      syncPostSummary(detail);

      return detail;
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Không tải được bình luận bài viết.";
      setDetailErrors((current) => ({ ...current, [postId]: message }));
      throw requestError;
    } finally {
      setLoadingDetails((current) => ({ ...current, [postId]: false }));
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await likePost(postId);
      syncPostSummary(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể thích bài viết.");
    }
  };

  const handleSave = async (postId) => {
    try {
      const response = await savePost(postId);
      syncPostSummary(response.data);
      setNotice(response.data.savedBy?.includes(user.id) ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể lưu bài viết.");
    }
  };

  const handleShare = async (postId) => {
    const link = `${window.location.origin}/home#post-${postId}`;

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Đã sao chép link bài viết.");
    } catch {
      setNotice(link);
    }
  };

  const handleToggleComments = async (postId) => {
    const nextOpen = !expandedPosts[postId];

    setExpandedPosts((current) => ({
      ...current,
      [postId]: nextOpen,
    }));

    if (!nextOpen) {
      return;
    }

    try {
      await loadPostDetail(postId);
    } catch {
      // Inline error state is shown below the post.
    }
  };

  const handleCommentDraftChange = (postId, value) => {
    setCommentDrafts((current) => ({
      ...current,
      [postId]: value,
    }));
  };

  const handleComment = async (postId) => {
    const content = commentDrafts[postId]?.trim();

    if (!content) {
      setError("Bạn cần nhập nội dung bình luận.");
      return;
    }

    if (!postDetails[postId]) {
      try {
        await loadPostDetail(postId);
      } catch {
        return;
      }
    }

    setSubmittingCommentPostId(postId);
    setError("");

    try {
      const response = await commentPost(postId, { content });
      const newComment = response.data;

      setPostDetails((current) => {
        const currentDetail = current[postId];

        if (!currentDetail) {
          return current;
        }

        return {
          ...current,
          [postId]: {
            ...currentDetail,
            comments: [...(currentDetail.comments || []), newComment],
            commentsCount: (currentDetail.commentsCount || 0) + 1,
          },
        };
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentsCount: post.commentsCount + 1,
              }
            : post
        )
      );
      setCommentDrafts((current) => ({
        ...current,
        [postId]: "",
      }));
      setNotice("Đã gửi bình luận.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể gửi bình luận.");
    } finally {
      setSubmittingCommentPostId("");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Xóa bình luận này?")) {
      return;
    }

    try {
      await deleteComment(commentId);
      setPostDetails((current) => {
        const currentDetail = current[postId];

        if (!currentDetail) {
          return current;
        }

        return {
          ...current,
          [postId]: {
            ...currentDetail,
            comments: (currentDetail.comments || []).filter((comment) => comment.id !== commentId),
            commentsCount: Math.max(0, (currentDetail.commentsCount || 0) - 1),
          },
        };
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentsCount: Math.max(0, post.commentsCount - 1),
              }
            : post
        )
      );
      setNotice("Đã xóa bình luận.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa bình luận.");
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

  const handleDeletePost = async (postId, payload = {}) => {
    try {
      await deletePost(postId, payload);
      await reloadLoadedFeed();
      setNotice("Đã xóa bài viết.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xóa bài viết.");
    }
  };

  const handleDeleteRequest = async (post) => {
    if (isAdmin) {
      setDeleteTarget(post);
      return;
    }

    if (!window.confirm("Xóa bài viết này?")) {
      return;
    }

    await handleDeletePost(post.id);
  };

  const handleConfirmAdminDelete = async (payload) => {
    if (!deleteTarget) {
      return;
    }

    setDeletingPost(true);

    try {
      await handleDeletePost(deleteTarget.id, payload);
      setDeleteTarget(null);
    } finally {
      setDeletingPost(false);
    }
  };

  const categoryMap = posts.reduce((accumulator, post) => {
    accumulator[post.category] = (accumulator[post.category] || 0) + 1;
    return accumulator;
  }, {});

  const topCategories = Object.entries(categoryMap)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return (
    <section className="page-stack">
      {false ? (
        <div className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">Bảng tin sinh viên</p>
          <h2>Bài viết an toàn được đăng ngay, chỉ bài có dấu hiệu rủi ro mới qua admin.</h2>
          <p>
            Bảng tin giờ tải dần khi bạn cuộn xuống. Phần bình luận, báo cáo và phóng to ảnh vẫn nằm ngay trên từng bài
            viết nhưng chỉ tải khi thực sự cần dùng.
          </p>
          <div className="hero-panel__actions">
            <button type="button" className="primary-button" onClick={() => navigate("/create-post")}>
              Tạo bài viết
            </button>
            <button type="button" className="outline-button" onClick={() => navigate("/profile")}>
              Xem trang cá nhân
            </button>
          </div>
        </div>

        <div className="hero-panel__aside">
          <p className="eyebrow">Tổng quan nhanh</p>
          <h3>Thông tin hiển thị theo dữ liệu hiện tại của diễn đàn</h3>
          <div className="hero-panel__mini-grid">
            <div className="mini-stat">
              <strong>{pagination.totalItems}</strong>
              <span>Bài công khai</span>
              <small>Tổng số bài đang hiển thị toàn diễn đàn</small>
            </div>
            <div className="mini-stat">
              <strong>{posts.length}</strong>
              <span>Đã tải</span>
              <small>Số bài hiện đã được lazy load lên màn hình</small>
            </div>
            <div className="mini-stat">
              <strong>{user?.savedPostIds?.length || 0}</strong>
              <span>Bài đã lưu</span>
              <small>Dựa trên hồ sơ đăng nhập</small>
            </div>
          </div>
        </div>
        </div>
      ) : null}

      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div className="content-grid">
        <div className="stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Feed</p>
              <h3>Bài viết đang hiển thị công khai</h3>
            </div>
            <span className="section-heading__note">
              Đã tải {posts.length}/{pagination.totalItems || 0} bài viết
            </span>
          </div>

          {loading ? <div className="panel empty-state">Đang tải bài viết...</div> : null}

          {!loading && !posts.length ? <div className="panel empty-state">Chưa có bài viết công khai nào.</div> : null}

          {!loading
            ? posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  commentsOpen={Boolean(expandedPosts[post.id])}
                  isLiked={post.likedBy?.includes(user.id)}
                  isSaved={post.savedBy?.includes(user.id)}
                  canReport={post.authorId !== user.id}
                  canEdit={isAdmin || post.authorId === user.id}
                  canDelete={isAdmin || post.authorId === user.id}
                  onLike={() => handleLike(post.id)}
                  onToggleComments={() => handleToggleComments(post.id)}
                  onSave={() => handleSave(post.id)}
                  onShare={() => handleShare(post.id)}
                  onReport={() => setReportTarget({ type: "post", id: post.id, label: `bài viết "${post.title}"` })}
                  onEdit={() => navigate(`/create-post?edit=${post.id}`)}
                  onDelete={() => handleDeleteRequest(post)}
                  onImageClick={(src, title) => setLightboxImage({ src, title })}
                  onAuthorClick={(authorId) => navigate(`/users/${authorId}`)}
                >
                  {expandedPosts[post.id] ? (
                    <div className="inline-discussion">
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">Bình luận ngay trên feed</p>
                          <h3>Trao đổi dưới bài viết</h3>
                        </div>
                        <span className="section-heading__note">{post.commentsCount} phản hồi</span>
                      </div>

                      <div className="field">
                        <label htmlFor={`comment-${post.id}`}>Thêm bình luận</label>
                        <textarea
                          id={`comment-${post.id}`}
                          className="text-area short"
                          placeholder="Nhập ý kiến của bạn về bài viết này"
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) => handleCommentDraftChange(post.id, event.target.value)}
                        />
                      </div>

                      <div className="action-row">
                        <button
                          type="button"
                          className="primary-button compact"
                          onClick={() => handleComment(post.id)}
                          disabled={submittingCommentPostId === post.id}
                        >
                          {submittingCommentPostId === post.id ? "Đang gửi..." : "Gửi bình luận"}
                        </button>
                        <button
                          type="button"
                          className="ghost-button compact"
                          onClick={() => handleToggleComments(post.id)}
                        >
                          Thu gọn
                        </button>
                      </div>

                      {loadingDetails[post.id] ? <div className="empty-state">Đang tải bình luận...</div> : null}
                      {detailErrors[post.id] ? <div className="form-error">{detailErrors[post.id]}</div> : null}

                      {!loadingDetails[post.id] && !detailErrors[post.id] ? (
                        <div className="comment-thread">
                          {postDetails[post.id]?.comments?.length ? (
                            postDetails[post.id].comments.map((comment) => (
                              <CommentItem
                                key={comment.id}
                                comment={comment}
                                canDelete={isAdmin || comment.authorId === user.id}
                                onDelete={() => handleDeleteComment(post.id, comment.id)}
                                onAuthorClick={(authorId) => navigate(`/users/${authorId}`)}
                                onReport={
                                  comment.authorId !== user.id
                                    ? () =>
                                        setReportTarget({
                                          type: "comment",
                                          id: comment.id,
                                          label: `bình luận của ${comment.author}`,
                                        })
                                    : undefined
                                }
                              />
                            ))
                          ) : (
                            <div className="empty-state">Chưa có bình luận nào.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </PostCard>
              ))
            : null}

          {!loading && posts.length ? (
            <div ref={loadMoreRef} className="panel empty-state">
              {loadingMore
                ? "Đang tải thêm bài viết..."
                : pagination.hasNextPage
                  ? "Kéo xuống thêm để tải tiếp bài viết."
                  : `Đã tải hết ${posts.length} bài viết đang công khai.`}
            </div>
          ) : null}
        </div>

        <aside className="aside-stack">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Chủ đề nổi bật</p>
                <h3>Phân bố bài viết đã tải lên feed</h3>
              </div>
            </div>
            <div className="trend-list">
              {topCategories.length ? (
                topCategories.map(([category, count]) => (
                  <div key={category} className="trend-item">
                    <strong>{category}</strong>
                    <span>{count} bài viết</span>
                  </div>
                ))
              ) : (
                <div className="trend-item">
                  <strong>Chưa có dữ liệu</strong>
                  <span>Hãy tạo bài viết đầu tiên</span>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Nội quy</p>
                <h3>3 điều cần nhớ</h3>
              </div>
            </div>
            <ul className="clean-list">
              <li>Chỉ đăng nội dung phù hợp với môi trường học tập nội bộ.</li>
              <li>Mỗi bài viết tối đa một ảnh minh họa.</li>
              <li>Dùng report khi gặp nội dung vi phạm thay vì tranh cãi công khai.</li>
            </ul>
          </div>
        </aside>
      </div>

      <DeletePostModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleConfirmAdminDelete}
        submitting={deletingPost}
        title="Xóa bài viết khỏi diễn đàn"
        confirmLabel="Xác nhận xóa bài"
        targetLabel={deleteTarget ? `bài viết "${deleteTarget.title}"` : "bài viết này"}
      />

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
        submitting={reporting}
        targetLabel={reportTarget?.label}
      />

      {lightboxImage ? (
        <div className="modal-backdrop modal-backdrop--lightbox" onClick={() => setLightboxImage(null)}>
          <div
            className="modal modal--lightbox"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Xem ảnh</p>
                <h3>{lightboxImage.title}</h3>
              </div>
              <button type="button" className="ghost-button compact" onClick={() => setLightboxImage(null)}>
                Đóng
              </button>
            </div>
            <div className="lightbox-image-frame">
              <img src={lightboxImage.src} alt={lightboxImage.title} className="lightbox-image" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Home;
