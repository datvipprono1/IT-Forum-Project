const fs = require("fs");
const path = require("path");
const { deleteUploadedImage } = require("./imageStorageService");
const { analyzePostModeration, normalizeText } = require("./moderationService");
const { getModerationMetaByDeletionReason } = require("../constants/moderationReasonMeta");

const dataFilePath = path.join(__dirname, "../data/store.json");

function ensureDataFile() {
  if (!fs.existsSync(dataFilePath)) {
    throw new Error(`Missing data store at ${dataFilePath}`);
  }
}

function readState() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(raw);
}

function writeState(state) {
  fs.writeFileSync(dataFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function withState(mutator) {
  const state = readState();
  const result = mutator(state);
  writeState(state);
  return result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function ensureArray(state, key) {
  if (!Array.isArray(state[key])) {
    state[key] = [];
  }
}

function ensureCounter(state, key) {
  if (!state.counters || typeof state.counters !== "object") {
    state.counters = {};
  }

  if (typeof state.counters[key] !== "number") {
    state.counters[key] = 1;
  }
}

function createPasswordResetToken({ userId, email, tokenHash, expiresAt }) {
  return withState((state) => {
    ensureArray(state, "passwordResetTokens");
    const timestamp = nowIso();

    state.passwordResetTokens.forEach((item) => {
      if (
        item.email?.toLowerCase() === email.toLowerCase() &&
        !item.consumedAt &&
        !item.revokedAt
      ) {
        item.revokedAt = timestamp;
        item.updatedAt = timestamp;
      }
    });

    const resetToken = {
      id: nextId(state, "passwordResetToken", "reset_token"),
      userId,
      email,
      tokenHash,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt,
      consumedAt: null,
      revokedAt: null,
    };

    state.passwordResetTokens.push(resetToken);
    return clone(resetToken);
  });
}

function revokePasswordResetToken(tokenId) {
  return withState((state) => {
    ensureArray(state, "passwordResetTokens");
    const resetToken = state.passwordResetTokens.find((item) => item.id === tokenId);

    if (!resetToken) {
      return null;
    }

    if (!resetToken.consumedAt && !resetToken.revokedAt) {
      const timestamp = nowIso();
      resetToken.revokedAt = timestamp;
      resetToken.updatedAt = timestamp;
    }

    return clone(resetToken);
  });
}

function validatePasswordResetToken({ tokenHash }) {
  const state = readState();
  ensureArray(state, "passwordResetTokens");
  const now = Date.now();

  const resetToken = state.passwordResetTokens
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .find(
      (item) =>
        item.tokenHash === tokenHash &&
        !item.consumedAt &&
        !item.revokedAt
    );

  if (!resetToken) {
    throw new Error("RESET_TOKEN_INVALID");
  }

  if (new Date(resetToken.expiresAt).getTime() <= now) {
    throw new Error("RESET_TOKEN_EXPIRED");
  }

  return clone(resetToken);
}

function markPasswordResetTokenConsumed(tokenId) {
  return withState((state) => {
    ensureArray(state, "passwordResetTokens");
    const resetToken = state.passwordResetTokens.find((item) => item.id === tokenId);

    if (!resetToken) {
      throw new Error("RESET_TOKEN_NOT_FOUND");
    }

    const timestamp = nowIso();
    resetToken.consumedAt = timestamp;
    resetToken.updatedAt = timestamp;

    state.passwordResetTokens.forEach((item) => {
      if (
        item.id !== tokenId &&
        item.email?.toLowerCase() === resetToken.email?.toLowerCase() &&
        !item.consumedAt &&
        !item.revokedAt
      ) {
        item.revokedAt = timestamp;
        item.updatedAt = timestamp;
      }
    });

    return clone(resetToken);
  });
}

function normalizePaginationValue(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginateItems(items, { page = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(normalizePaginationValue(limit, 10), 50);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
  const currentPage = Math.min(normalizePaginationValue(page, 1), totalPages);
  const startIndex = (currentPage - 1) * safeLimit;
  const paginatedItems = items.slice(startIndex, startIndex + safeLimit);
  const from = totalItems ? startIndex + 1 : 0;
  const to = totalItems ? Math.min(startIndex + safeLimit, totalItems) : 0;

  return {
    items: paginatedItems,
    pagination: {
      currentPage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      from,
      to,
    },
  };
}

function buildSlug(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nextId(state, key, prefix) {
  ensureCounter(state, key);
  state.counters[key] = (state.counters[key] || 1) + 1;
  return `${prefix}_${state.counters[key] - 1}`;
}

function getCategoryById(state, categoryId) {
  return state.categories.find((item) => item.id === categoryId) || null;
}

function getUserById(state, userId) {
  return state.users.find((item) => item.id === userId) || null;
}

function getUserByEmail(state, email) {
  return state.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
}

function getUserByFirebaseUid(state, firebaseUid) {
  return state.users.find((item) => item.firebaseUid === firebaseUid) || null;
}

function buildPublicUserSummary(state, user) {
  const approvedPostsCount = state.posts.filter(
    (post) => post.authorId === user.id && post.status === "approved"
  ).length;

  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    studentId: user.studentId,
    faculty: user.faculty,
    bio: user.bio,
    avatar: user.avatar,
    approvedPostsCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getPostById(state, postId) {
  return state.posts.find((item) => item.id === postId) || null;
}

function getCommentById(state, commentId) {
  return state.comments.find((item) => item.id === commentId) || null;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    studentId: user.studentId,
    faculty: user.faculty,
    bio: user.bio,
    avatar: user.avatar,
    savedPostIds: user.savedPostIds || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildPostSummary(state, post) {
  const author = getUserById(state, post.authorId);
  const category = getCategoryById(state, post.categoryId);
  const commentsCount = state.comments.filter((item) => item.postId === post.id).length;
  const summary = post.summary || post.content || "";
  const content = post.content || post.summary || "";

  return {
    id: post.id,
    title: post.title,
    summary,
    content,
    categoryId: post.categoryId,
    category: category ? category.name : "Chưa phân loại",
    authorId: post.authorId,
    author: author ? author.fullName : "Ẩn danh",
    authorRole: author ? author.role : "student",
    authorEmail: author ? author.email : "",
    authorAvatar: author ? author.avatar : "NA",
    authorFaculty: author ? author.faculty : "",
    likes: post.likes.length,
    likedBy: post.likes,
    saves: post.savedBy.length,
    savedBy: post.savedBy,
    commentsCount,
    status: post.status,
    imageUrl: post.imageUrl || "",
    moderationReasons: post.moderationReasons || [],
    moderationSeverity: post.moderationSeverity || "low",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function buildCommentSummary(state, comment) {
  const author = getUserById(state, comment.authorId);

  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    author: author ? author.fullName : "Ẩn danh",
    role: author ? author.role : "student",
    authorEmail: author ? author.email : "",
    authorAvatar: author ? author.avatar : "NA",
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

function buildReportSummary(state, report) {
  const reporter = getUserById(state, report.reporterId);
  const post = report.targetType === "post" ? getPostById(state, report.targetId) : null;
  const comment = report.targetType === "comment" ? getCommentById(state, report.targetId) : null;
  const owner = post
    ? getUserById(state, post.authorId)
    : comment
      ? getUserById(state, comment.authorId)
      : null;

  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    title: post ? post.title : comment ? comment.content.slice(0, 80) : "Không xác định",
    preview: post ? post.summary || post.content?.slice(0, 140) || "" : comment ? comment.content : "",
    reporter: reporter ? reporter.fullName : "Ẩn danh",
    reporterEmail: reporter ? reporter.email : "",
    ownerId: owner ? owner.id : "",
    ownerName: owner ? owner.fullName : "Ẩn danh",
    ownerEmail: owner ? owner.email : "",
    ownerStatus: owner ? owner.status : "active",
    reason: report.reason,
    note: report.note,
    severity: report.severity,
    status: report.status,
    targetStatus: post ? post.status : "",
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

function buildNotificationSummary(state, notification) {
  const actor = notification.actorId ? getUserById(state, notification.actorId) : null;

  return {
    id: notification.id,
    type: notification.type || "general",
    title: notification.title || "Thông báo mới",
    message: notification.message || "",
    actionPath: notification.actionPath || "",
    severity: notification.severity || "info",
    entityType: notification.entityType || "",
    entityId: notification.entityId || "",
    read: Boolean(notification.readAt),
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    readAt: notification.readAt || null,
    actor: actor
      ? {
          id: actor.id,
          fullName: actor.fullName,
          avatar: actor.avatar,
          role: actor.role,
        }
      : null,
  };
}

function trimNotificationsForUser(state, userId, maxItems = 60) {
  ensureArray(state, "notifications");

  const notificationsForUser = state.notifications
    .filter((item) => item.userId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  if (notificationsForUser.length <= maxItems) {
    return;
  }

  const keepIds = new Set(notificationsForUser.slice(0, maxItems).map((item) => item.id));
  state.notifications = state.notifications.filter((item) => item.userId !== userId || keepIds.has(item.id));
}

function createNotification(state, payload) {
  ensureArray(state, "notifications");

  const userId = payload.userId || "";
  const user = getUserById(state, userId);

  if (!user) {
    return null;
  }

  const timestamp = nowIso();
  const notification = {
    id: nextId(state, "notification", "notif"),
    userId,
    type: payload.type || "general",
    title: String(payload.title || "Thông báo mới").trim(),
    message: String(payload.message || "").trim(),
    actionPath: payload.actionPath || "",
    severity: payload.severity || "info",
    entityType: payload.entityType || "",
    entityId: payload.entityId || "",
    actorId: payload.actorId || "",
    createdAt: timestamp,
    updatedAt: timestamp,
    readAt: null,
  };

  state.notifications.push(notification);
  trimNotificationsForUser(state, userId);

  return notification;
}

function notifyAdmins(state, payload) {
  return state.users
    .filter((user) => user.role === "admin" && user.status === "active")
    .map((user) =>
      createNotification(state, {
        ...payload,
        userId: user.id,
      })
    )
    .filter(Boolean);
}

function defaultRoleByEmail(email) {
  return email.toLowerCase() === "admin1@itforum.local" ? "admin" : "student";
}

function buildAvatar(fullName, email) {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

function getCustomModerationRules(state) {
  ensureArray(state, "customModerationTerms");

  return state.customModerationTerms
    .filter((item) => item?.phrase && item?.category)
    .map((item) => ({
      category: item.category,
      severity: item.severity || "medium",
      phrases: [item.phrase],
    }));
}

function buildModerationResult(state, payload) {
  const normalizedSummary = payload.summary?.trim() || payload.content?.trim() || "";

  return analyzePostModeration({
    title: payload.title,
    summary: normalizedSummary,
    content: normalizedSummary,
    imageOriginalName: payload.imageOriginalName,
    customRules: getCustomModerationRules(state),
  });
}

function normalizePostText(summary, content = "") {
  const normalizedSummary = summary?.trim() || content?.trim() || "";

  return {
    summary: normalizedSummary,
    content: normalizedSummary,
  };
}

function parseViolationTerms(input) {
  const rawTerms = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\n,;]+/g)
      : [];

  const seen = new Set();

  return rawTerms
    .map((term) => String(term || "").trim())
    .filter(Boolean)
    .filter((term) => term.length >= 2 && term.length <= 80)
    .filter((term) => {
      const normalized = normalizeText(term);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, 20);
}

function registerViolationTerms(state, { actor, deletionReason, violationTerms = [], postId = "" }) {
  const parsedTerms = parseViolationTerms(violationTerms);

  if (!parsedTerms.length) {
    return [];
  }

  ensureArray(state, "customModerationTerms");
  const moderationMeta = getModerationMetaByDeletionReason(deletionReason);
  const existingNormalizedTerms = new Set(
    state.customModerationTerms.map((item) => item.normalizedPhrase).filter(Boolean)
  );

  const createdTerms = [];

  parsedTerms.forEach((term) => {
    const normalizedPhrase = normalizeText(term);

    if (!normalizedPhrase || existingNormalizedTerms.has(normalizedPhrase)) {
      return;
    }

    const storedTerm = {
      id: nextId(state, "customModerationTerm", "term"),
      phrase: term,
      normalizedPhrase,
      category: moderationMeta.category,
      severity: moderationMeta.severity,
      sourceReason: deletionReason,
      sourcePostId: postId,
      createdById: actor.id,
      createdAt: nowIso(),
    };

    state.customModerationTerms.push(storedTerm);
    existingNormalizedTerms.add(normalizedPhrase);
    createdTerms.push(storedTerm);
  });

  return createdTerms;
}

function recordPostDeletion(state, { post, actor, deletionReason = "", action, violationTerms = [] }) {
  ensureArray(state, "postDeletionLogs");

  state.postDeletionLogs.push({
    id: nextId(state, "postDeletionLog", "delete_log"),
    postId: post.id,
    postTitle: post.title,
    postSummary: post.summary || post.content || "",
    authorId: post.authorId,
    deletedById: actor.id,
    deletedByRole: actor.role,
    action,
    reason: deletionReason || (actor.role === "admin" ? "" : "Tác giả tự xóa bài viết"),
    violationTerms: parseViolationTerms(violationTerms),
    createdAt: nowIso(),
  });
}

function removePostRelations(state, postId) {
  state.comments = state.comments.filter((item) => item.postId !== postId);
  state.reports = state.reports.filter(
    (item) => !(item.targetType === "post" && item.targetId === postId)
  );

  state.users.forEach((user) => {
    user.savedPostIds = (user.savedPostIds || []).filter((item) => item !== postId);
  });
}

function upsertUserFromAuth({ firebaseUid, email, displayName }) {
  return withState((state) => {
    let user = getUserByEmail(state, email) || getUserByFirebaseUid(state, firebaseUid);
    const timestamp = nowIso();

    if (!user) {
      const derivedRole = defaultRoleByEmail(email);
      user = {
        id: nextId(state, "user", "user"),
        firebaseUid,
        email,
        fullName: displayName || email,
        role: derivedRole,
        status: "active",
        studentId: email.endsWith("@dntu.edu.vn") ? email.split("@")[0] : "",
        faculty: "Khoa Công nghệ",
        bio: "",
        avatar: buildAvatar(displayName, email),
        savedPostIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.users.push(user);
    } else {
      user.firebaseUid = firebaseUid || user.firebaseUid;
      user.fullName = displayName || user.fullName;
      user.avatar = buildAvatar(user.fullName, user.email);
      user.updatedAt = timestamp;
    }

    return sanitizeUser(user);
  });
}

function createManagedUserProfile({ firebaseUid, email, fullName, role, status, studentId, faculty, bio }) {
  return withState((state) => {
    let user = getUserByEmail(state, email) || getUserByFirebaseUid(state, firebaseUid);
    const timestamp = nowIso();
    const isNewUser = !user;

    if (isNewUser) {
      user = {
        id: nextId(state, "user", "user"),
        firebaseUid,
        email,
        fullName,
        role,
        status,
        studentId,
        faculty: faculty || "Khoa Công nghệ",
        bio: bio || "",
        avatar: buildAvatar(fullName, email),
        savedPostIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.users.push(user);
    } else {
      user.firebaseUid = firebaseUid || user.firebaseUid;
      user.fullName = fullName || user.fullName;
      user.role = role || user.role;
      user.status = status || user.status;
      user.studentId = studentId || user.studentId;
      user.faculty = faculty || user.faculty;
      user.bio = typeof bio === "string" ? bio : user.bio;
      user.avatar = buildAvatar(user.fullName, user.email);
      user.updatedAt = timestamp;
    }

    if (isNewUser) {
      createNotification(state, {
        userId: user.id,
        type: "account_created",
        title: "Tài khoản diễn đàn đã sẵn sàng",
        message: `Admin đã cấp cho bạn tài khoản ${user.email}. Hãy đăng nhập và cập nhật hồ sơ cá nhân.`,
        actionPath: "/profile",
        severity: "success",
      });
    }

    return sanitizeUser(user);
  });
}

function getUserProfileByEmail(email) {
  const state = readState();
  return sanitizeUser(getUserByEmail(state, email));
}

function getUserProfileById(userId) {
  const state = readState();
  return sanitizeUser(getUserById(state, userId));
}

function getUserProfileWithStats(userId) {
  const state = readState();
  const user = getUserById(state, userId);

  if (!user) {
    return null;
  }

  const userPosts = state.posts.filter((post) => post.authorId === userId);

  return {
    ...sanitizeUser(user),
    stats: {
      totalPosts: userPosts.length,
      approvedPosts: userPosts.filter((post) => post.status === "approved").length,
      pendingPosts: userPosts.filter((post) => post.status === "pending").length,
      savedPosts: (user.savedPostIds || []).length,
    },
  };
}

function listUsers() {
  const state = readState();

  return state.users
    .map((user) => ({
      ...sanitizeUser(user),
      postsCount: state.posts.filter((post) => post.authorId === user.id).length,
    }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function searchUsers(query = "") {
  const state = readState();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  return state.users
    .filter((user) => user.status === "active")
    .map((user) => {
      const searchableName = normalizeText(user.fullName);
      const searchableStudentId = normalizeText(user.studentId || "");
      const searchableEmail = normalizeText(user.email || "");
      const matches =
        searchableName.includes(normalizedQuery) ||
        searchableStudentId.includes(normalizedQuery) ||
        searchableEmail.includes(normalizedQuery);

      if (!matches) {
        return null;
      }

      let score = 0;

      if (searchableStudentId === normalizedQuery) {
        score += 120;
      } else if (searchableStudentId.startsWith(normalizedQuery)) {
        score += 90;
      }

      if (searchableName === normalizedQuery) {
        score += 100;
      } else if (searchableName.startsWith(normalizedQuery)) {
        score += 80;
      } else if (searchableName.includes(normalizedQuery)) {
        score += 40;
      }

      if (searchableEmail.startsWith(normalizedQuery)) {
        score += 30;
      }

      return {
        ...buildPublicUserSummary(state, user),
        score,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.fullName.localeCompare(right.fullName, "vi");
    })
    .slice(0, 8)
    .map(({ score, ...user }) => user);
}

function getPublicUserProfile(userId) {
  const state = readState();
  const user = getUserById(state, userId);

  if (!user) {
    return null;
  }

  const authoredPosts = state.posts
    .filter((post) => post.authorId === userId && post.status === "approved")
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((post) => buildPostSummary(state, post));

  return {
    ...buildPublicUserSummary(state, user),
    stats: {
      approvedPosts: authoredPosts.length,
    },
    authoredPosts,
  };
}

function updateUserProfile(userId, payload) {
  return withState((state) => {
    const user = getUserById(state, userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (typeof payload.fullName === "string" && payload.fullName.trim()) {
      user.fullName = payload.fullName.trim();
      user.avatar = buildAvatar(user.fullName, user.email);
    }

    if (typeof payload.faculty === "string") {
      user.faculty = payload.faculty.trim();
    }

    if (typeof payload.bio === "string") {
      user.bio = payload.bio.trim();
    }

    user.updatedAt = nowIso();

    return sanitizeUser(user);
  });
}

function toggleUserStatus(userId) {
  return withState((state) => {
    const user = getUserById(state, userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    user.status = user.status === "locked" ? "active" : "locked";
    user.updatedAt = nowIso();

    createNotification(state, {
      userId: user.id,
      type: user.status === "locked" ? "account_locked" : "account_unlocked",
      title: user.status === "locked" ? "Tài khoản đã bị khóa" : "Tài khoản đã được mở khóa",
      message:
        user.status === "locked"
          ? "Admin đã tạm khóa tài khoản của bạn. Liên hệ quản trị viên nếu bạn cần hỗ trợ."
          : "Admin đã mở khóa tài khoản của bạn. Bạn có thể tiếp tục sử dụng diễn đàn.",
      actionPath: "/profile",
      severity: user.status === "locked" ? "danger" : "success",
    });

    return sanitizeUser(user);
  });
}

function listCategories() {
  const state = readState();
  return clone(state.categories);
}

function createCategory(name) {
  return withState((state) => {
    const normalizedName = name.trim();
    const slug = buildSlug(normalizedName);
    const existing = state.categories.find((item) => item.slug === slug);

    if (existing) {
      return clone(existing);
    }

    const category = {
      id: nextId(state, "category", "cat"),
      name: normalizedName,
      slug,
      createdAt: nowIso(),
    };

    state.categories.push(category);
    return clone(category);
  });
}

function getPosts({ includePending = false, page = 1, limit = 10 } = {}) {
  const state = readState();
  const items = state.posts
    .filter((post) => (includePending ? true : post.status === "approved"))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((post) => buildPostSummary(state, post));

  return paginateItems(items, { page, limit });
}

function getPostDetail(postId) {
  const state = readState();
  const post = getPostById(state, postId);

  if (!post) {
    return null;
  }

  const detail = buildPostSummary(state, post);
  const comments = state.comments
    .filter((item) => item.postId === post.id)
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    .map((comment) => buildCommentSummary(state, comment));

  return {
    ...detail,
    comments,
  };
}

function getManagedPost(postId, actor) {
  const post = getPostDetail(postId);

  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }

  if (actor.role !== "admin" && post.authorId !== actor.id) {
    throw new Error("FORBIDDEN");
  }

  return post;
}

function createPost({ title, summary, content, categoryId, authorId, imageUrl, imageOriginalName }) {
  return withState((state) => {
    const user = getUserById(state, authorId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedText = normalizePostText(summary, content);
    const moderation = buildModerationResult(state, {
      title,
      summary: normalizedText.summary,
      content: normalizedText.content,
      imageOriginalName,
    });

    const timestamp = nowIso();
    const post = {
      id: nextId(state, "post", "post"),
      title: title.trim(),
      summary: normalizedText.summary,
      content: normalizedText.content,
      categoryId,
      authorId,
      status: moderation.status,
      imageUrl: imageUrl?.trim() || "",
      moderationReasons: moderation.reasons,
      moderationSeverity: moderation.severity,
      likes: [],
      savedBy: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.posts.push(post);

    if (moderation.status === "pending") {
      createNotification(state, {
        userId: authorId,
        type: "post_pending",
        title: "Bài viết đang chờ kiểm duyệt",
        message: `Bài "${post.title}" có dấu hiệu nhạy cảm và đã được chuyển đến admin để xem xét.`,
        actionPath: "/profile",
        severity: moderation.severity === "high" ? "danger" : "warning",
        entityType: "post",
        entityId: post.id,
      });

      notifyAdmins(state, {
        type: "admin_pending_post",
        title: "Có bài viết cần duyệt",
        message: `${user.fullName} vừa đăng "${post.title}" và bài đang chờ admin kiểm duyệt.`,
        actionPath: "/admin/pending-posts",
        actorId: authorId,
        severity: moderation.severity === "high" ? "danger" : "warning",
        entityType: "post",
        entityId: post.id,
      });
    }

    return buildPostSummary(state, post);
  });
}

function updatePost(postId, actor, payload) {
  return withState((state) => {
    const post = getPostById(state, postId);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    if (actor.role !== "admin" && post.authorId !== actor.id) {
      throw new Error("FORBIDDEN");
    }

    const previousStatus = post.status;
    const nextTitle = typeof payload.title === "string" && payload.title.trim() ? payload.title.trim() : post.title;
    const nextSummarySource = typeof payload.summary === "string" ? payload.summary : post.summary || post.content;
    const normalizedText = normalizePostText(nextSummarySource, post.content);
    const nextCategoryId =
      typeof payload.categoryId === "string" && payload.categoryId.trim() ? payload.categoryId.trim() : post.categoryId;
    const nextImageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : post.imageUrl || "";

    const moderation = buildModerationResult(state, {
      title: nextTitle,
      summary: normalizedText.summary,
      content: normalizedText.content,
      imageOriginalName: payload.imageOriginalName,
    });

    post.title = nextTitle;
    post.summary = normalizedText.summary;
    post.content = normalizedText.content;
    post.categoryId = nextCategoryId;
    post.imageUrl = nextImageUrl;
    post.status = moderation.status;
    post.moderationReasons = moderation.reasons;
    post.moderationSeverity = moderation.severity;
    post.updatedAt = nowIso();

    if (post.status === "pending") {
      createNotification(state, {
        userId: post.authorId,
        type: "post_pending",
        title:
          previousStatus === "pending"
            ? "Bài viết vẫn đang chờ kiểm duyệt"
            : "Bài chỉnh sửa đã chuyển sang chờ kiểm duyệt",
        message: `Bài "${post.title}" đang chờ admin xem xét trước khi hiển thị lại trên diễn đàn.`,
        actionPath: "/profile",
        severity: moderation.severity === "high" ? "danger" : "warning",
        entityType: "post",
        entityId: post.id,
      });

      notifyAdmins(state, {
        type: "admin_pending_post",
        title: "Có bài viết cần duyệt lại",
        message: `${actor.fullName} vừa cập nhật "${post.title}" và bài đang chờ admin kiểm duyệt.`,
        actionPath: "/admin/pending-posts",
        actorId: actor.id,
        severity: moderation.severity === "high" ? "danger" : "warning",
        entityType: "post",
        entityId: post.id,
      });
    }

    return buildPostSummary(state, post);
  });
}

function deletePost(postId, actor, deletionReason = "", violationTerms = []) {
  return withState((state) => {
    const postIndex = state.posts.findIndex((item) => item.id === postId);

    if (postIndex === -1) {
      throw new Error("POST_NOT_FOUND");
    }

    const post = state.posts[postIndex];

    if (actor.role !== "admin" && post.authorId !== actor.id) {
      throw new Error("FORBIDDEN");
    }

    const savedViolationTerms = actor.role === "admin"
      ? registerViolationTerms(state, {
          actor,
          deletionReason,
          violationTerms,
          postId: post.id,
        })
      : [];

    if (post.imageUrl) {
      deleteUploadedImage(post.imageUrl);
    }

    recordPostDeletion(state, {
      post,
      actor,
      deletionReason,
      action: "delete",
      violationTerms: savedViolationTerms.map((item) => item.phrase),
    });

    if (actor.role === "admin" && post.authorId !== actor.id) {
      createNotification(state, {
        userId: post.authorId,
        type: "post_removed",
        title: "Bài viết đã bị gỡ khỏi diễn đàn",
        message: deletionReason
          ? `Bài "${post.title}" đã bị admin xóa. Lý do: ${deletionReason}.`
          : `Bài "${post.title}" đã bị admin xóa khỏi diễn đàn.`,
        actionPath: "/profile",
        actorId: actor.id,
        severity: "danger",
        entityType: "post",
        entityId: post.id,
      });
    }

    state.posts.splice(postIndex, 1);
    removePostRelations(state, postId);

    return { success: true };
  });
}

function toggleLike(postId, userId) {
  return withState((state) => {
    const post = getPostById(state, postId);
    const actor = getUserById(state, userId);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    const alreadyLiked = post.likes.includes(userId);
    post.likes = alreadyLiked ? post.likes.filter((item) => item !== userId) : [...post.likes, userId];
    post.updatedAt = nowIso();

    if (!alreadyLiked && actor && post.authorId !== userId) {
      createNotification(state, {
        userId: post.authorId,
        type: "post_like",
        title: "Bài viết có lượt thích mới",
        message: `${actor.fullName} vừa thích bài "${post.title}".`,
        actionPath: "/profile",
        actorId: userId,
        severity: "info",
        entityType: "post",
        entityId: post.id,
      });
    }

    return buildPostSummary(state, post);
  });
}

function toggleSave(postId, userId) {
  return withState((state) => {
    const post = getPostById(state, postId);
    const user = getUserById(state, userId);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isSaved = post.savedBy.includes(userId);
    post.savedBy = isSaved ? post.savedBy.filter((item) => item !== userId) : [...post.savedBy, userId];
    user.savedPostIds = isSaved
      ? (user.savedPostIds || []).filter((item) => item !== postId)
      : [...new Set([...(user.savedPostIds || []), postId])];
    post.updatedAt = nowIso();
    user.updatedAt = nowIso();

    return buildPostSummary(state, post);
  });
}

function createComment(postId, userId, content) {
  return withState((state) => {
    const post = getPostById(state, postId);
    const actor = getUserById(state, userId);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    const timestamp = nowIso();
    const comment = {
      id: nextId(state, "comment", "comment"),
      postId,
      authorId: userId,
      content: content.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.comments.push(comment);

    if (actor && post.authorId !== userId) {
      createNotification(state, {
        userId: post.authorId,
        type: "post_comment",
        title: "Bài viết có bình luận mới",
        message: `${actor.fullName} vừa bình luận trong bài "${post.title}".`,
        actionPath: "/profile",
        actorId: userId,
        severity: "info",
        entityType: "post",
        entityId: post.id,
      });
    }

    return buildCommentSummary(state, comment);
  });
}

function deleteComment(commentId, actor) {
  return withState((state) => {
    const commentIndex = state.comments.findIndex((item) => item.id === commentId);

    if (commentIndex === -1) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    const comment = state.comments[commentIndex];
    const post = getPostById(state, comment.postId);

    if (actor.role !== "admin" && comment.authorId !== actor.id) {
      throw new Error("FORBIDDEN");
    }

    if (actor.role === "admin" && comment.authorId !== actor.id) {
      createNotification(state, {
        userId: comment.authorId,
        type: "comment_removed",
        title: "Bình luận đã bị xóa",
        message: post
          ? `Admin đã gỡ bình luận của bạn trong bài "${post.title}".`
          : "Admin đã gỡ một bình luận của bạn vì vi phạm nội quy.",
        actionPath: "/profile",
        actorId: actor.id,
        severity: "warning",
        entityType: "comment",
        entityId: comment.id,
      });
    }

    state.comments.splice(commentIndex, 1);
    state.reports = state.reports.filter(
      (item) => !(item.targetType === "comment" && item.targetId === commentId)
    );

    return { success: true };
  });
}

function createReport({ targetType, targetId, reporterId, reason, note, severity }) {
  return withState((state) => {
    const targetExists =
      targetType === "post"
        ? Boolean(getPostById(state, targetId))
        : targetType === "comment"
          ? Boolean(getCommentById(state, targetId))
          : false;

    if (!targetExists) {
      throw new Error("TARGET_NOT_FOUND");
    }

    const targetPost = targetType === "post" ? getPostById(state, targetId) : null;
    const targetComment = targetType === "comment" ? getCommentById(state, targetId) : null;
    const reporter = getUserById(state, reporterId);
    const ownerId = targetPost ? targetPost.authorId : targetComment ? targetComment.authorId : "";
    const timestamp = nowIso();
    const report = {
      id: nextId(state, "report", "report"),
      targetType,
      targetId,
      reporterId,
      reason: reason.trim(),
      note: note?.trim() || "",
      severity: severity || "medium",
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.reports.push(report);

    notifyAdmins(state, {
      type: "admin_new_report",
      title: targetType === "post" ? "Có báo cáo bài viết mới" : "Có báo cáo bình luận mới",
      message:
        targetType === "post"
          ? `${reporter?.fullName || "Một người dùng"} vừa báo cáo bài "${targetPost?.title || "không xác định"}".`
          : `${reporter?.fullName || "Một người dùng"} vừa báo cáo một bình luận và cần admin xem xét.`,
      actionPath: "/admin/reports",
      actorId: reporterId,
      severity: report.severity === "high" ? "danger" : "warning",
      entityType: targetType,
      entityId: targetId,
    });

    if (ownerId && ownerId !== reporterId) {
      createNotification(state, {
        userId: ownerId,
        type: "content_reported",
        title: targetType === "post" ? "Bài viết đang được xem xét" : "Bình luận đang được xem xét",
        message:
          targetType === "post"
            ? `Bài "${targetPost?.title || "không xác định"}" vừa bị báo cáo và đang chờ admin kiểm tra.`
            : "Một bình luận của bạn vừa bị báo cáo và đang chờ admin kiểm tra.",
        actionPath: "/profile",
        severity: "warning",
        entityType: targetType,
        entityId: targetId,
      });
    }

    return buildReportSummary(state, report);
  });
}

function listSavedPosts(userId) {
  const state = readState();
  const user = getUserById(state, userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return (user.savedPostIds || [])
    .map((postId) => getPostById(state, postId))
    .filter(Boolean)
    .map((post) => buildPostSummary(state, post));
}

function listPostsByAuthor(userId) {
  const state = readState();

  return state.posts
    .filter((post) => post.authorId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((post) => buildPostSummary(state, post));
}

function listPendingPosts() {
  const state = readState();

  return state.posts
    .filter((post) => post.status === "pending")
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((post) => buildPostSummary(state, post));
}

function approvePost(postId) {
  return withState((state) => {
    const post = getPostById(state, postId);

    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    post.status = "approved";
    post.updatedAt = nowIso();

    createNotification(state, {
      userId: post.authorId,
      type: "post_approved",
      title: "Bài viết đã được duyệt",
      message: `Bài "${post.title}" đã được admin phê duyệt và đang hiển thị trên diễn đàn.`,
      actionPath: "/profile",
      severity: "success",
      entityType: "post",
      entityId: post.id,
    });

    return buildPostSummary(state, post);
  });
}

function rejectPost(postId, actor, deletionReason = "", violationTerms = []) {
  return withState((state) => {
    const postIndex = state.posts.findIndex((item) => item.id === postId);

    if (postIndex === -1) {
      throw new Error("POST_NOT_FOUND");
    }

    const post = state.posts[postIndex];

    const savedViolationTerms = actor.role === "admin"
      ? registerViolationTerms(state, {
          actor,
          deletionReason,
          violationTerms,
          postId: post.id,
        })
      : [];

    if (post.imageUrl) {
      deleteUploadedImage(post.imageUrl);
    }

    recordPostDeletion(state, {
      post,
      actor,
      deletionReason,
      action: "reject",
      violationTerms: savedViolationTerms.map((item) => item.phrase),
    });

    createNotification(state, {
      userId: post.authorId,
      type: "post_rejected",
      title: "Bài viết đã bị từ chối",
      message: deletionReason
        ? `Bài "${post.title}" đã bị admin gỡ trong bước kiểm duyệt. Lý do: ${deletionReason}.`
        : `Bài "${post.title}" đã bị admin từ chối trong bước kiểm duyệt.`,
      actionPath: "/profile",
      actorId: actor.id,
      severity: "danger",
      entityType: "post",
      entityId: post.id,
    });

    state.posts.splice(postIndex, 1);
    removePostRelations(state, postId);

    return { success: true };
  });
}

function listReports() {
  const state = readState();

  return state.reports
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((report) => buildReportSummary(state, report));
}

function updateReportStatus(reportId, status) {
  return withState((state) => {
    const report = state.reports.find((item) => item.id === reportId);

    if (!report) {
      throw new Error("REPORT_NOT_FOUND");
    }

    report.status = status;
    report.updatedAt = nowIso();

    createNotification(state, {
      userId: report.reporterId,
      type: "report_status_updated",
      title: "Báo cáo của bạn đã được cập nhật",
      message:
        status === "resolved"
          ? "Admin đã xử lý xong báo cáo bạn gửi."
          : "Admin đã xem báo cáo bạn gửi và cập nhật trạng thái xử lý.",
      actionPath: "/home",
      severity: status === "resolved" ? "success" : "info",
      entityType: report.targetType,
      entityId: report.targetId,
    });

    return buildReportSummary(state, report);
  });
}

function listNotifications(userId, { limit = 12 } = {}) {
  const state = readState();
  ensureArray(state, "notifications");
  const safeLimit = Math.min(normalizePaginationValue(limit, 12), 30);
  const notifications = state.notifications
    .filter((item) => item.userId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  return {
    unreadCount: notifications.filter((item) => !item.readAt).length,
    totalItems: notifications.length,
    items: notifications.slice(0, safeLimit).map((item) => buildNotificationSummary(state, item)),
  };
}

function markNotificationRead(userId, notificationId) {
  return withState((state) => {
    ensureArray(state, "notifications");
    const notification = state.notifications.find((item) => item.id === notificationId && item.userId === userId);

    if (!notification) {
      throw new Error("NOTIFICATION_NOT_FOUND");
    }

    if (!notification.readAt) {
      const timestamp = nowIso();
      notification.readAt = timestamp;
      notification.updatedAt = timestamp;
    }

    return {
      unreadCount: state.notifications.filter((item) => item.userId === userId && !item.readAt).length,
      notification: buildNotificationSummary(state, notification),
    };
  });
}

function markAllNotificationsRead(userId) {
  return withState((state) => {
    ensureArray(state, "notifications");
    const timestamp = nowIso();
    let updatedCount = 0;

    state.notifications.forEach((item) => {
      if (item.userId === userId && !item.readAt) {
        item.readAt = timestamp;
        item.updatedAt = timestamp;
        updatedCount += 1;
      }
    });

    return {
      unreadCount: 0,
      updatedCount,
    };
  });
}

function getStatistics() {
  const state = readState();

  return {
    totalUsers: state.users.length,
    totalPosts: state.posts.length,
    pendingPosts: state.posts.filter((item) => item.status === "pending").length,
    totalReports: state.reports.length,
    activeUsers: state.users.filter((item) => item.status === "active").length,
    lockedUsers: state.users.filter((item) => item.status === "locked").length,
  };
}

module.exports = {
  approvePost,
  createPasswordResetToken,
  createCategory,
  createComment,
  createManagedUserProfile,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  getCategories: listCategories,
  getManagedPost,
  getPostDetail,
  getPosts,
  getStatistics,
  getUserProfileByEmail,
  getUserProfileById,
  getUserProfileWithStats,
  listPendingPosts,
  listPostsByAuthor,
  listNotifications,
  listReports,
  listSavedPosts,
  listUsers,
  markAllNotificationsRead,
  markPasswordResetTokenConsumed,
  markNotificationRead,
  revokePasswordResetToken,
  searchUsers,
  getPublicUserProfile,
  rejectPost,
  toggleLike,
  toggleSave,
  toggleUserStatus,
  updatePost,
  updateReportStatus,
  updateUserProfile,
  upsertUserFromAuth,
  validatePasswordResetToken,
};
