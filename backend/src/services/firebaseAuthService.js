const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";

function getApiKey() {
  if (!process.env.FIREBASE_WEB_API_KEY) {
    throw new Error("Missing FIREBASE_WEB_API_KEY in backend/.env");
  }

  return process.env.FIREBASE_WEB_API_KEY;
}

async function callIdentityToolkit(endpoint, payload) {
  const apiKey = getApiKey();
  const response = await fetch(`${FIREBASE_AUTH_BASE_URL}/${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "FIREBASE_AUTH_REQUEST_FAILED");
    error.code = data?.error?.message || "FIREBASE_AUTH_REQUEST_FAILED";
    error.details = data;
    throw error;
  }

  return data;
}

function normalizeAuthUser(data, fallback = {}) {
  return {
    uid: data.localId || fallback.uid || "",
    email: data.email || fallback.email || "",
    displayName: data.displayName || fallback.displayName || "",
  };
}

async function signInWithPassword(email, password) {
  const data = await callIdentityToolkit("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  return {
    ...normalizeAuthUser(data),
    idToken: data.idToken,
    refreshToken: data.refreshToken,
  };
}

async function updateDisplayName(idToken, displayName) {
  const data = await callIdentityToolkit("accounts:update", {
    idToken,
    displayName,
    returnSecureToken: true,
  });

  return {
    ...normalizeAuthUser(data),
    idToken: data.idToken,
  };
}

async function createPasswordUser({ email, password, displayName }) {
  const data = await callIdentityToolkit("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  if (!displayName) {
    return normalizeAuthUser(data);
  }

  const baseUser = normalizeAuthUser(data);
  const updated = await updateDisplayName(data.idToken, displayName);
  return normalizeAuthUser(updated, baseUser);
}

async function ensurePasswordUser({ email, password, displayName }) {
  try {
    const createdUser = await createPasswordUser({ email, password, displayName });
    return {
      ...createdUser,
      status: "created",
    };
  } catch (error) {
    if (error.code !== "EMAIL_EXISTS") {
      throw error;
    }

    const existingUser = await signInWithPassword(email, password);

    if (displayName) {
      const updatedUser = await updateDisplayName(existingUser.idToken, displayName);
      return {
        ...normalizeAuthUser(updatedUser, existingUser),
        status: "already_exists",
      };
    }

    return {
      ...normalizeAuthUser(existingUser),
      status: "already_exists",
    };
  }
}

async function updatePasswordWithCurrentCredentials({ email, currentPassword, newPassword }) {
  const signedInUser = await signInWithPassword(email, currentPassword);
  const data = await callIdentityToolkit("accounts:update", {
    idToken: signedInUser.idToken,
    password: newPassword,
    returnSecureToken: true,
  });

  return normalizeAuthUser(data, signedInUser);
}

module.exports = {
  ensurePasswordUser,
  signInWithPassword,
  updatePasswordWithCurrentCredentials,
};
