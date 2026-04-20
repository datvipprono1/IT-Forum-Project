import formatDate from "../../utils/formatDate";
import { getRoleLabel } from "../../utils/labels";

function CommentItem({ comment, canDelete = false, onDelete, onReport, onAuthorClick }) {
  return (
    <div className="comment-card">
      <div className="comment-card__avatar">{comment.authorAvatar || comment.author.slice(0, 2).toUpperCase()}</div>
      <div className="comment-card__content">
        <div className="comment-card__head">
          <button type="button" className="comment-card__author-link" onClick={() => onAuthorClick?.(comment.authorId)}>
            {comment.author}
          </button>
          <span>{getRoleLabel(comment.role)}</span>
          <span>{formatDate(comment.createdAt)}</span>
        </div>
        <p>{comment.content}</p>
        <div className="comment-card__actions">
          {onReport ? (
            <button type="button" className="ghost-button compact" onClick={onReport}>
              Báo cáo
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="ghost-button compact danger" onClick={onDelete}>
              Xóa bình luận
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
