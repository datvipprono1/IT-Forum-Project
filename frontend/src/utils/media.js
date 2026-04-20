function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export function resolveMediaUrl(input) {
  if (!input) {
    return "";
  }

  if (/^https?:\/\//i.test(input) || input.startsWith("data:")) {
    return input;
  }

  if (input.startsWith("/")) {
    return `${getBackendOrigin()}${input}`;
  }

  return `${getBackendOrigin()}/${input}`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}
