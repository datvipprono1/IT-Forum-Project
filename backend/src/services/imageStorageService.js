const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const uploadsRoot = path.join(__dirname, "../../uploads");
const postUploadsDir = path.join(uploadsRoot, "posts");

function ensureUploadsDir() {
  if (!fs.existsSync(postUploadsDir)) {
    fs.mkdirSync(postUploadsDir, { recursive: true });
  }
}

function parseImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") {
    throw new Error("INVALID_IMAGE_DATA");
  }

  const match = dataUrl.match(/^data:(image\/png|image\/jpeg|image\/jpg|image\/webp|image\/gif);base64,(.+)$/);

  if (!match) {
    throw new Error("UNSUPPORTED_IMAGE_FORMAT");
  }

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const extensionMap = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return {
    mimeType,
    extension: extensionMap[mimeType],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function buildRelativeUploadPath(fileName) {
  return `/uploads/posts/${fileName}`;
}

function extractRelativeUploadPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    return url.pathname.startsWith("/uploads/") ? url.pathname : "";
  } catch {
    return "";
  }
}

function savePostImage({ imageBase64, originalName = "" }) {
  ensureUploadsDir();

  const parsedImage = parseImageDataUrl(imageBase64);

  if (parsedImage.buffer.length > 5 * 1024 * 1024) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const safeStem = (originalName || "post-image")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  const fileName = `${Date.now()}-${safeStem || "post-image"}-${crypto.randomBytes(4).toString("hex")}.${parsedImage.extension}`;
  const absolutePath = path.join(postUploadsDir, fileName);

  fs.writeFileSync(absolutePath, parsedImage.buffer);

  return buildRelativeUploadPath(fileName);
}

function deleteUploadedImage(imageUrl) {
  const relativePath = extractRelativeUploadPath(imageUrl);

  if (!relativePath) {
    return;
  }

  const absolutePath = path.join(uploadsRoot, relativePath.replace(/^\/uploads[\\/]/, ""));

  if (!absolutePath.startsWith(uploadsRoot)) {
    return;
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

module.exports = {
  deleteUploadedImage,
  extractRelativeUploadPath,
  savePostImage,
};
