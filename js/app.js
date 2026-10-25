const wishlist = document.getElementById("wishlist");
const emptyState = document.getElementById("empty-state");
const itemCount = document.getElementById("item-count");
const search = document.getElementById("search");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const closeModal = document.getElementById("close-modal");
const themeToggle = document.getElementById("theme-toggle");
const connectionStatus = document.getElementById("connection-status");
const db = wishlistDatabase();
let items = [];
let previouslyFocused = null;

function money(value) {
  const amount = Number(value);
  return value !== "" && value !== null && value !== undefined && Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount)
    : "";
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = items.filter(item => `${item.name} ${item.description}`.toLocaleLowerCase().includes(query));
  itemCount.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
  wishlist.replaceChildren();

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";
    const imageUrl = safeUrl(item.image);
    const image = imageUrl
      ? `<img class="card-image" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(item.name)}" loading="lazy">`
      : `<div class="card-image image-placeholder" aria-hidden="true">✳</div>`;
    const productUrl = safeUrl(item.url);
    const price = money(item.price);
    card.innerHTML = `
      ${image}
      <div class="card-body">
        <h3>${escapeHtml(item.name)}</h3>
        ${price ? `<p class="price">${escapeHtml(price)}</p>` : ""}
        <p>${escapeHtml(item.description)}</p>
        <div class="card-actions">
          ${productUrl ? `<a class="button secondary" href="${escapeAttr(productUrl)}" target="_blank" rel="noopener noreferrer">View item ↗</a>` : ""}
          ${item.reserved
            ? `<button class="button reserved" disabled>Reserved</button>`
            : `<button class="button primary" data-reserve="${escapeAttr(item.id)}">I’ll get this</button>`}
        </div>
      </div>`;
    const img = card.querySelector("img");
    if (img) img.addEventListener("error", () => {
      const placeholder = document.createElement("div");
      placeholder.className = "card-image image-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = "✳";
      img.replaceWith(placeholder);
    }, { once: true });
    wishlist.appendChild(card);
  });

  emptyState.classList.toggle("hidden", filtered.length > 0 || connectionStatus.classList.contains("is-error"));
  emptyState.querySelector("h3").textContent = items.length && query ? "No matches on Bibek’s list" : "Nothing on Bibek’s list yet";
  emptyState.querySelector("p").textContent = items.length && query ? "Try a different search." : "I’ll add a few things here soon.";
}

async function loadItems() {
  if (!db) {
    connectionStatus.textContent = "Connect this site to Supabase to load the shared wishlist. See the setup steps in README.";
    connectionStatus.classList.add("is-error");
    return;
  }
  const { data, error } = await db.from("wishlist_items").select("id,name,description,price,image,url,reserved,created_at").order("created_at", { ascending: true });
  if (error) {
    connectionStatus.textContent = "The shared wishlist could not be loaded. Check the database setup and refresh.";
    connectionStatus.classList.add("is-error");
    return;
  }
  items = data ?? [];
  connectionStatus.textContent = "Live wishlist · changes sync automatically";
  connectionStatus.classList.remove("is-error");
  render();
}

function reserveItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item || item.reserved) return;
  previouslyFocused = document.activeElement;
  modalContent.innerHTML = `
    <h2 id="modal-title">Reserve “${escapeHtml(item.name)}”?</h2>
    <p>This will mark the item as reserved for everyone viewing the wishlist.</p>
    <div class="form-actions">
      <button class="button primary" id="confirm-reserve" type="button">Reserve item</button>
      <button class="button secondary" id="cancel-reserve" type="button">Cancel</button>
    </div>`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("confirm-reserve").focus();
  document.getElementById("cancel-reserve").onclick = closeReservation;
  document.getElementById("confirm-reserve").onclick = async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Saving…";
    const { data, error } = await db.rpc("reserve_wishlist_item", { p_item_id: id });
    if (error) {
      button.disabled = false;
      button.textContent = "Reserve item";
      connectionStatus.textContent = "The reservation could not be saved. Please try again.";
      connectionStatus.classList.add("is-error");
      return;
    }
    closeReservation();
    if (!data) connectionStatus.textContent = "Someone else just reserved that item.";
    await loadItems();
  };
}

function closeReservation() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if (previouslyFocused?.isConnected) previouslyFocused.focus();
}

wishlist.addEventListener("click", event => {
  const button = event.target.closest("[data-reserve]");
  if (button) reserveItem(button.dataset.reserve);
});
search.addEventListener("input", render);
closeModal.onclick = closeReservation;
modal.addEventListener("click", event => { if (event.target === modal) closeReservation(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) closeReservation();
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  themeToggle.innerHTML = `<span aria-hidden="true">${theme === "dark" ? "☀" : "☾"}</span>`;
}
let theme = "light";
try { theme = localStorage.getItem("wishlistTheme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch { /* Theme still works for this visit. */ }
applyTheme(theme);
themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try { localStorage.setItem("wishlistTheme", theme); } catch { /* Theme still works for this visit. */ }
});

if (db) {
  db.channel("wishlist-live-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "wishlist_items" }, loadItems)
    .subscribe();
}
loadItems();
