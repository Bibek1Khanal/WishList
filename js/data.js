// Configure js/supabase-config.js with your project's URL and publishable key.
function wishlistDatabase() {
  return window.wishlistSupabase ?? null;
}

function safeUrl(value) {
  try {
    if (!String(value ?? "").trim()) return "";
    const url = new URL(String(value), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
