const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function api(path, options = {}) {
  const send = async (accessToken) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };
  let response = await send(localStorage.getItem("goodthings.access"));
  if (response.status === 401 && !path.startsWith("/auth/")) {
    const refresh = localStorage.getItem("goodthings.refresh");
    if (refresh) {
      const refreshed = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (refreshed.ok) {
        const tokens = await refreshed.json();
        localStorage.setItem("goodthings.access", tokens.access);
        response = await send(tokens.access);
      } else {
        clearTokens();
      }
    }
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Object.values(data).flat().map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") return Object.values(entry).flat().join(" ");
      return "";
    }).filter(Boolean).join(" ");
    throw new Error(message || "Something went wrong. Please try again.");
  }
  return data;
}

export function saveTokens(tokens) {
  localStorage.setItem("goodthings.access", tokens.access);
  localStorage.setItem("goodthings.refresh", tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem("goodthings.access");
  localStorage.removeItem("goodthings.refresh");
}

export function hasSession() {
  return Boolean(localStorage.getItem("goodthings.access"));
}

export async function login(username, password) {
  const tokens = await api("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveTokens(tokens);
  return tokens;
}

export async function register({ username, email, password }) {
  await api("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  return login(username, password);
}
