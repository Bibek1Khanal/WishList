const db = wishlistDatabase();
const form = document.getElementById("item-form");
const editId = document.getElementById("edit-id");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const priceInput = document.getElementById("price");
const imageInput = document.getElementById("image");
const urlInput = document.getElementById("url");
const adminList = document.getElementById("admin-list");
const adminCount = document.getElementById("admin-count");
const cancelEdit = document.getElementById("cancel-edit");
const clearAll = document.getElementById("clear-all");
const loginForm = document.getElementById("login-form");
const authPanel = document.getElementById("auth-panel");
const authStatus = document.getElementById("auth-status");
const managerStatus = document.getElementById("manager-status");
const authSignOut = document.getElementById("auth-sign-out");
const legacyImportPanel = document.getElementById("legacy-import");
const legacyImportButton = document.getElementById("import-legacy");
const managerContent = document.getElementById("manager-content");
const themeToggle = document.getElementById("theme-toggle");
const themeInStorage = (() => {
  try { return localStorage.getItem("wishlistTheme"); } catch { return null; }
})();
let theme = themeInStorage || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
let items = [];

function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  themeToggle.setAttribute("aria-label", `Switch to ${value === "dark" ? "light" : "dark"} mode`);
  themeToggle.innerHTML = `<span aria-hidden="true">${value === "dark" ? "☀" : "☾"}</span>`;
}
applyTheme(theme);
themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try { localStorage.setItem("wishlistTheme", theme); } catch { /* Theme still applies for this visit. */ }
});

function showSignedIn(user) {
  if (user) {
    authPanel.classList.add("hidden");
    authSignOut.classList.add("hidden");
    managerContent.classList.remove("hidden");
    loadAdmin();
  } else {
    authPanel.classList.remove("hidden");
    authSignOut.classList.add("hidden");
    managerContent.classList.add("hidden");
  }
}

async function loadAdmin() {
  if (!db) return;
  const { data, error } = await db.from("wishlist_items").select("*").order("created_at", { ascending: true });
  if (error) {
    managerContent.classList.add("hidden");
    authPanel.classList.remove("hidden");
    authStatus.textContent = "This account is not authorized to manage this wishlist. Check the admin email in your database policy.";
    authSignOut.classList.remove("hidden");
    return;
  }
  items = data ?? [];
  renderAdmin();
  showLegacyImport();
}

function getLegacyItems() {
  try {
    if (localStorage.getItem("wishlistLegacyImported") === "true") return [];
    const parsed = JSON.parse(localStorage.getItem("wishlistItems") || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && item.name && item.description).map(item => ({
      name: String(item.name).slice(0, 100),
      description: String(item.description).slice(0, 500),
      price: item.price === "" || item.price === null || item.price === undefined ? null : Number(item.price),
      image: safeUrl(item.image) ? String(item.image) : "",
      url: safeUrl(item.url) ? String(item.url) : "",
      reserved: Boolean(item.reserved)
    })).filter(item => Number.isFinite(item.price) || item.price === null);
  } catch { return []; }
}

function showLegacyImport() {
  const legacyItems = getLegacyItems();
  legacyImportPanel.classList.toggle("hidden", items.length !== 0 || legacyItems.length === 0);
  legacyImportButton.dataset.count = String(legacyItems.length);
}

legacyImportButton.addEventListener("click", async () => {
  const legacyItems = getLegacyItems();
  if (!legacyItems.length || !confirm(`Import ${legacyItems.length} saved item${legacyItems.length === 1 ? "" : "s"} into the shared wishlist?`)) return;
  const { error } = await db.from("wishlist_items").insert(legacyItems);
  if (error) {
    managerStatus.textContent = "The old items could not be imported. Please try again.";
    return;
  }
  try { localStorage.setItem("wishlistLegacyImported", "true"); } catch { /* The import is already saved in Supabase. */ }
  managerStatus.textContent = "Your saved items are now in the shared wishlist.";
  await loadAdmin();
});

function renderAdmin() {
  adminCount.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  adminList.innerHTML = items.length
    ? items.map(item => `
      <div class="admin-item">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${item.reserved ? "Reserved" : "Available"}</p>
        </div>
        <div class="admin-item-actions">
          <button class="button secondary" data-edit="${escapeAttr(item.id)}" type="button">Edit</button>
          ${item.reserved ? `<button class="button secondary" data-unreserve="${escapeAttr(item.id)}" type="button">Clear reservation</button>` : ""}
          <button class="button danger" data-delete="${escapeAttr(item.id)}" type="button">Delete</button>
        </div>
      </div>`).join("")
    : `<p>No wishlist items yet.</p>`;
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!db) {
    authStatus.textContent = "Supabase is not configured yet. Add your project URL and publishable key in js/supabase-config.js.";
    return;
  }
  authStatus.textContent = "Signing in…";
  const { error } = await db.auth.signInWithPassword({
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value
  });
  authStatus.textContent = error ? "Sign in failed. Check your email and password." : "Signed in.";
});

async function signOut() {
  if (!db) return;
  await db.auth.signOut();
  loginForm.reset();
  authStatus.textContent = "You are signed out.";
}
document.getElementById("sign-out").addEventListener("click", signOut);
authSignOut.addEventListener("click", signOut);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const image = imageInput.value.trim();
  const url = urlInput.value.trim();
  if ((image && !safeUrl(image)) || (url && !safeUrl(url))) {
    managerStatus.textContent = "Use a valid http or https link for the image and product URL.";
    return;
  }
  const payload = {
    name: nameInput.value.trim(),
    description: descriptionInput.value.trim(),
    price: priceInput.value === "" ? null : Number(priceInput.value),
    image,
    url
  };
  const request = editId.value
    ? db.from("wishlist_items").update(payload).eq("id", editId.value)
    : db.from("wishlist_items").insert(payload);
  const { error } = await request;
  if (error) {
    managerStatus.textContent = "The item could not be saved. Check your Supabase setup and try again.";
    return;
  }
  resetForm();
  await loadAdmin();
});

adminList.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const unreserveButton = event.target.closest("[data-unreserve]");
  if (editButton) startEdit(editButton.dataset.edit);
  if (unreserveButton) {
    const { error } = await db.from("wishlist_items").update({ reserved: false }).eq("id", unreserveButton.dataset.unreserve);
    if (error) managerStatus.textContent = "The reservation could not be cleared. Please try again.";
    else await loadAdmin();
  }
  if (deleteButton) {
    const item = items.find(entry => entry.id === deleteButton.dataset.delete);
    if (!item || !confirm(`Delete “${item.name}” from the shared wishlist?`)) return;
    const { error } = await db.from("wishlist_items").delete().eq("id", item.id);
    if (error) managerStatus.textContent = "The item could not be deleted. Please try again.";
    else await loadAdmin();
  }
});

function startEdit(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  editId.value = item.id;
  nameInput.value = item.name;
  descriptionInput.value = item.description;
  priceInput.value = item.price ?? "";
  imageInput.value = item.image ?? "";
  urlInput.value = item.url ?? "";
  cancelEdit.classList.remove("hidden");
  nameInput.focus();
}

function resetForm() {
  form.reset();
  editId.value = "";
  cancelEdit.classList.add("hidden");
}
cancelEdit.onclick = resetForm;

clearAll.onclick = async () => {
  if (!items.length || !confirm("Delete every item from the shared wishlist?")) return;
  const { error } = await db.from("wishlist_items").delete().in("id", items.map(item => item.id));
  if (error) managerStatus.textContent = "The items could not be deleted. Please try again.";
  else {
    resetForm();
    await loadAdmin();
  }
};

if (!db) {
  authStatus.textContent = "Supabase is not configured yet. Add your project URL and publishable key in js/supabase-config.js.";
} else {
  db.auth.getSession().then(({ data, error }) => {
    if (error) authStatus.textContent = "Could not check your sign-in. Refresh and try again.";
    showSignedIn(data?.session?.user ?? null);
  });
  db.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => showSignedIn(session?.user ?? null), 0);
  });
  db.channel("wishlist-admin-live-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "wishlist_items" }, loadAdmin)
    .subscribe();
}
