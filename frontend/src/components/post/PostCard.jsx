import formatDate from "../../utils/formatDate";
import { getRoleLabel } from "../../utils/labels";
import { resolveMediaUrl } from "../../utils/media";

function PostCard({
  post,
  isLiked,
  isSaved,
  commentsOpen = false,
  canReport = false,
  canEdit = false,
  canDelete = false,
  onLike,
  onToggleComments,
  onSave,
  onShare,
  onReport,
  onEdit,
  onDelete,
  onImageClick,
  onAuthorClick,
  children,
}) {
  const imageSrc = resolveMediaUrl(post.imageUrl);

  return (
    <article id={`post-${post.id}`} className="panel post-card">
      <div className="post-card__header">
        <button type="button" className="post-card__author post-card__author-button" onClick={() => onAuthorClick?.(post.authorId)}>
          <div className="avatar-badge">{post.authorAvatar || post.author.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{post.author}</strong>
            <p>
              {getRoleLabel(post.authorRole)}
              {post.authorFaculty ? ` • ${post.authorFaculty}` : ""}
            </p>
          </div>
        </button>
        <span className="status-pill status-pill--published">{post.category}</span>
      </div>

      <div className="post-card__body">
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__excerpt">{post.summary}</p>
      </div>

      {imageSrc ? (
        <button
          type="button"
          className="post-card__visual post-card__visual--image post-card__image-button"
          onClick={() => onImageClick?.(imageSrc, post.title)}
        >
          <img src={imageSrc} alt={post.title} className="post-card__image" />
          <span className="post-card__visual-badge">Nhấn để phóng to ảnh</span>
        </button>
      ) : null}

      <div className="post-card__meta">
        <span>{formatDate(post.createdAt)}</span>
        <span>{post.likes} lượt thích</span>
        <span>{post.commentsCount} bình luận</span>
        <span>{post.saves} lượt lưu</span>
      </div>

      <div className="action-row">
        <button type="button" className={isLiked ? "primary-button compact" : "ghost-button compact"} onClick={onLike}>
          {isLiked ? "Đã thích" : "Thích"}
        </button>
        <button type="button" className="ghost-button compact" onClick={onToggleComments}>
          {commentsOpen ? "Ẩn bình luận" : "Bình luận"}
        </button>
        <button type="button" className={isSaved ? "outline-button compact" : "ghost-button compact"} onClick={onSave}>
          {isSaved ? "Đã lưu" : "Lưu bài"}
        </button>
        <button type="button" className="ghost-button compact" onClick={onShare}>
          Sao chép link
        </button>
        {canReport ? (
          <button type="button" className="ghost-button compact" onClick={onReport}>
            Báo cáo
          </button>
        ) : null}
        {canEdit ? (
          <button type="button" className="outline-button compact" onClick={onEdit}>
            Chỉnh sửa
          </button>
        ) : null}
        {canDelete ? (
          <button type="button" className="ghost-button compact danger" onClick={onDelete}>
            Xóa bài
          </button>
        ) : null}
      </div>

      {children ? <div className="post-card__inline-section">{children}</div> : null}
    </article>
  );
}

export default PostCard;
