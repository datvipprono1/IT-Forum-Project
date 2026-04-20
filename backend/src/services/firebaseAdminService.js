const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

function createConfigError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeServiceAccount(serviceAccount) {
  if (!serviceAccount || typeof serviceAccount !== "object") {
    return null;
  }

  const normalized = { ...serviceAccount };
  if (typeof normalized.private_key === "string") {
    normalized.private_key = normalized.private_key.replace(/\\n/g, "\n");
  }

  return normalized;
}

function parseServiceAccountJson(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    return normalizeServiceAccount(JSON.parse(rawValue));
  } catch {
    throw createConfigError(
      "FIREBASE_ADMIN_CONFIG_INVALID",
      "Cấu hình FIREBASE service account không hợp lệ."
    );
  }
}

function resolveServiceAccount() {
  const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonValue) {
    return parseServiceAccountJson(jsonValue);
  }

  const base64Value = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (base64Value) {
    try {
      const decoded = Buffer.from(base64Value, "base64").toString("utf8");
      return parseServiceAccountJson(decoded);
    } catch {
      throw createConfigError(
        "FIREBASE_ADMIN_CONFIG_INVALID",
        "FIREBASE_SERVICE_ACCOUNT_BASE64 không hợp lệ."
      );
    }
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (serviceAccountPath) {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(absolutePath)) {
      throw createConfigError(
        "FIREBASE_ADMIN_CONFIG_INVALID",
        `Không tìm thấy file service account tại ${absolutePath}.`
      );
    }

    return parseServiceAccountJson(fs.readFileSync(absolutePath, "utf8"));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (projectId && clientEmail && privateKey) {
    return normalizeServiceAccount({
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    });
  }

  return null;
}

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount) {
    throw createConfigError(
      "FIREBASE_ADMIN_NOT_CONFIGURED",
      "Chức năng quên mật khẩu chưa được cấu hình Firebase Admin trên server."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
  });
}

async function getAuthUserByEmail(email) {
  const auth = getFirebaseAdminApp().auth();
  const existingUser = await auth.getUserByEmail(email);

  return {
    uid: existingUser.uid,
    email: existingUser.email || email,
    displayName: existingUser.displayName || "",
  };
}

async function resetPasswordByEmail(email, newPassword) {
  const auth = getFirebaseAdminApp().auth();
  const existingUser = await auth.getUserByEmail(email);
  const updatedUser = await auth.updateUser(existingUser.uid, { password: newPassword });

  return {
    uid: updatedUser.uid,
    email: updatedUser.email || existingUser.email || email,
    displayName: updatedUser.displayName || existingUser.displayName || "",
  };
}

module.exports = {
  getAuthUserByEmail,
  resetPasswordByEmail,
};
