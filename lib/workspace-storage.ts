const ACTIVE_WORKSPACE_KEY = "paytrack_store_id";

export function getActiveWorkspaceId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY)?.trim() ?? "";
}

export function setActiveWorkspaceId(storeId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, storeId.trim());
}

export function clearActiveWorkspaceId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}

export function workspaceStorageKey(baseKey: string) {
  const storeId = getActiveWorkspaceId();
  return `${baseKey}:${storeId || "anonymous"}`;
}
