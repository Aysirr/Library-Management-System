const API_BASE = "http://127.0.0.1:5001";

const state = { books: [], members: [], categories: [], borrowings: [] };

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function asList(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.data)) return data.data;
  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
}

const normalise = {
  book: (b) => ({
    id: b.book_id ?? b.id,
    title: b.title ?? "",
    author: b.author ?? "",
    isbn: b.isbn ?? "",
    categoryId: b.category_id ?? null,
    categoryName: b.category_name ?? (typeof b.category === "string" ? b.category : b.category?.name) ?? null,
    copies: b.copies ?? b.copies_available ?? 0,
  }),
  member: (m) => ({
    id: m.member_id ?? m.id,
    name: m.full_name ?? m.name ?? "",
    email: m.email ?? "",
    phone: m.phone ?? "",
  }),
  category: (c) => ({
    id: c.category_id ?? c.id,
    name: c.name ?? "",
    count: c.book_count ?? null,
  }),
  borrowing: (r) => ({
    id: r.borrow_id ?? r.borrowing_id ?? r.id,
    bookId: r.book_id ?? null,
    memberId: r.member_id ?? null,
    bookTitle: r.book_title ?? r.title ?? null,
    memberName: r.member_name ?? r.full_name ?? null,
    borrowDate: r.borrow_date ?? null,
    dueDate: r.due_date ?? null,
    returnDate: r.return_date ?? null,
  }),
};

async function loadAll() {
  try {
    const [books, members, categories, borrowings] = await Promise.all([
      api("/books"), api("/members"), api("/categories"), api("/borrowings"),
    ]);
    state.books = asList(books, "books").map(normalise.book);
    state.members = asList(members, "members").map(normalise.member);
    state.categories = asList(categories, "categories").map(normalise.category);
    state.borrowings = asList(borrowings, "borrowings").map(normalise.borrowing);
    hideApiError();
    renderAll();
  } catch (err) {
    showApiError(err);
  }
}

const $ = (sel) => document.querySelector(sel);

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return esc(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
}

function plural(n, word) { return `${n} ${word}${n === 1 ? "" : "s"}`; }

function statusOf(r) {
  if (r.returnDate) return { label: "Returned", cls: "" };
  if (r.dueDate && String(r.dueDate).slice(0, 10) < todayISO()) return { label: "Overdue", cls: "badge-overdue" };
  return { label: "Out", cls: "badge-out" };
}

const findBook = (id) => state.books.find((b) => String(b.id) === String(id));
const findMember = (id) => state.members.find((m) => String(m.id) === String(id));
const findCategory = (id) => state.categories.find((c) => String(c.id) === String(id));

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : ""}`;
  el.textContent = message;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function showApiError(err) {
  const box = $("#api-status");
  box.hidden = false;
  box.innerHTML = `<span>Couldn't reach the API at ${esc(API_BASE)} — ${esc(err.message)}. Is the Flask server running?</span>
    <button type="button" class="btn btn-sm btn-outline" id="retry-btn">Retry</button>`;
  $("#retry-btn").addEventListener("click", loadAll);
  ["#books-body", "#borrowings-body"].forEach((sel) => {
    const cols = sel === "#books-body" ? 6 : 7;
    $(sel).innerHTML = `<tr><td colspan="${cols}" class="empty">No data — the API isn't responding.</td></tr>`;
  });
  $("#members-grid").innerHTML = `<p class="empty">No data — the API isn't responding.</p>`;
  $("#categories-grid").innerHTML = `<p class="empty">No data — the API isn't responding.</p>`;
}

function hideApiError() { $("#api-status").hidden = true; }

function renderAll() {
  renderBooks();
  renderMembers();
  renderBorrowings();
  renderCategories();
  fillSelects();
}

function renderBooks() {
  const q = $("#book-search").value.trim().toLowerCase();
  const rows = state.books.filter((b) =>
    !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || String(b.isbn).toLowerCase().includes(q)
  );
  const body = $("#books-body");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty">${q ? "No books match your search." : "No books yet. Add your first one."}</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((b) => {
    const cat = b.categoryName ?? findCategory(b.categoryId)?.name;
    return `<tr>
      <td class="strong">${esc(b.title)}</td>
      <td class="soft">${esc(b.author)}</td>
      <td class="num">${esc(b.isbn)}</td>
      <td>${cat ? `<span class="badge">${esc(cat)}</span>` : `<span class="badge badge-muted">Uncategorised</span>`}</td>
      <td class="num">${esc(b.copies)}</td>
      <td class="right"><button type="button" class="btn btn-sm btn-danger" data-action="delete-book" data-id="${esc(b.id)}" data-label="${esc(b.title)}">Delete</button></td>
    </tr>`;
  }).join("");
}

function renderMembers() {
  const grid = $("#members-grid");
  if (!state.members.length) {
    grid.innerHTML = `<p class="empty">No members yet. Add your first one.</p>`;
    return;
  }
  grid.innerHTML = state.members.map((m) => {
    const out = state.borrowings.filter((r) => String(r.memberId) === String(m.id) && !r.returnDate).length;
    return `<article class="member-card">
      <div class="member-top">
        <span class="avatar" aria-hidden="true">${esc(initials(m.name))}</span>
        <div class="member-info">
          <div class="member-name">${esc(m.name)}</div>
          <div class="member-email">${esc(m.email)}</div>
        </div>
        <button type="button" class="btn btn-danger" data-action="delete-member" data-id="${esc(m.id)}" data-label="${esc(m.name)}">Delete</button>
      </div>
      <div class="member-bottom">
        <span class="muted">${m.phone ? esc(m.phone) : "No phone"}</span>
        <strong>${out} out</strong>
      </div>
    </article>`;
  }).join("");
}

function renderBorrowings() {
  const body = $("#borrowings-body");
  if (!state.borrowings.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty">No borrowings recorded yet.</td></tr>`;
    return;
  }

  const rows = [...state.borrowings].sort((a, b) => {
    if (!a.returnDate !== !b.returnDate) return a.returnDate ? 1 : -1;
    return String(b.borrowDate).localeCompare(String(a.borrowDate));
  });
  body.innerHTML = rows.map((r) => {
    const member = r.memberName ?? findMember(r.memberId)?.name ?? `Member #${r.memberId}`;
    const book = r.bookTitle ?? findBook(r.bookId)?.title ?? `Book #${r.bookId}`;
    const s = statusOf(r);
    const returnBtn = r.returnDate ? "" :
      `<button type="button" class="btn btn-sm btn-outline" data-action="return" data-id="${esc(r.id)}" data-label="${esc(book)}">Mark returned</button>`;
    return `<tr>
      <td class="strong">${esc(member)}</td>
      <td class="soft">${esc(book)}</td>
      <td class="num">${formatDate(r.borrowDate)}</td>
      <td class="num">${formatDate(r.dueDate)}</td>
      <td class="num">${formatDate(r.returnDate)}</td>
      <td><span class="badge ${s.cls}">${s.label}</span></td>
      <td class="right"><div style="display:flex;gap:8px;justify-content:flex-end">${returnBtn}
        <button type="button" class="btn btn-sm btn-danger" data-action="delete-borrowing" data-id="${esc(r.id)}" data-label="this borrowing record">Delete</button></div></td>
    </tr>`;
  }).join("");
}

function renderCategories() {
  const grid = $("#categories-grid");
  if (!state.categories.length) {
    grid.innerHTML = `<p class="empty">No categories yet.</p>`;
    return;
  }
  grid.innerHTML = state.categories.map((c) => {
    const count = c.count ?? state.books.filter((b) =>
      String(b.categoryId) === String(c.id) || (b.categoryId == null && b.categoryName === c.name)
    ).length;
    return `<div class="cat-card">
      <div>
        <div class="cat-name">${esc(c.name)}</div>
        <div class="cat-count">${plural(count, "book")}</div>
      </div>
      <button type="button" class="btn btn-danger" data-action="delete-category" data-id="${esc(c.id)}" data-label="${esc(c.name)}">Delete</button>
    </div>`;
  }).join("");
}

function fillSelects() {
  $("#book-category").innerHTML = `<option value="">Uncategorised</option>` +
    state.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");

  $("#borrow-member").innerHTML = state.members.length
    ? `<option value="" disabled selected>Choose a member</option>` +
      state.members.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("")
    : `<option value="" disabled selected>Add a member first</option>`;

  $("#borrow-book").innerHTML = state.books.length
    ? `<option value="" disabled selected>Choose a book</option>` +
      state.books.map((b) => `<option value="${esc(b.id)}" ${Number(b.copies) <= 0 ? "disabled" : ""}>${esc(b.title)} (${esc(b.copies)} left)</option>`).join("")
    : `<option value="" disabled selected>Add a book first</option>`;
}

const actions = {
  "delete-book": { method: "DELETE", path: (id) => `/books/${id}`, done: "Book deleted." },
  "delete-member": { method: "DELETE", path: (id) => `/members/${id}`, done: "Member deleted." },
  "delete-category": { method: "DELETE", path: (id) => `/categories/${id}`, done: "Category deleted." },
  "delete-borrowing": { method: "DELETE", path: (id) => `/borrowings/${id}`, done: "Borrowing record deleted." },
  "return": { method: "PUT", path: (id) => `/borrowings/${id}/return`, done: "Marked as returned.", noConfirm: true },
};

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = actions[btn.dataset.action];
  if (!action) return;
  if (!action.noConfirm && !confirm(`Delete ${btn.dataset.label}? This can't be undone.`)) return;

  btn.disabled = true;
  try {
    const data = await api(action.path(btn.dataset.id), { method: action.method });
    toast((data && data.message) || action.done);
    await loadAll();
  } catch (err) {
    toast(err.message, "error");
    btn.disabled = false;
  }
});

document.querySelectorAll("[data-open]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const dialog = document.getElementById(btn.dataset.open);
    if (dialog.id === "borrow-dialog") {
      const form = $("#borrow-form");
      form.borrow_date.value = todayISO();
      form.due_date.value = addDaysISO(todayISO(), 14);
    }
    dialog.showModal();
  })
);
document.querySelectorAll("dialog [data-close]").forEach((btn) =>
  btn.addEventListener("click", () => btn.closest("dialog").close())
);

async function submitJSON(form, path, buildBody, successMsg) {
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const data = await api(path, { method: "POST", body: JSON.stringify(buildBody(new FormData(form))) });
    toast((data && data.message) || successMsg);
    form.reset();
    form.closest("dialog")?.close();
    await loadAll();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    submit.disabled = false;
  }
}

$("#book-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitJSON(e.target, "/books", (f) => ({
    title: f.get("title").trim(),
    author: f.get("author").trim(),
    isbn: f.get("isbn").trim(),
    category_id: f.get("category_id") ? Number(f.get("category_id")) : null,
    copies: Number(f.get("copies")),
  }), "Book added.");
});

$("#member-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitJSON(e.target, "/members", (f) => ({
    full_name: f.get("full_name").trim(),
    email: f.get("email").trim().toLowerCase(),
    phone: f.get("phone").trim() || null,
  }), "Member added.");
});

$("#borrow-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get("due_date") < f.get("borrow_date")) {
    toast("Due date can't be before the borrow date.", "error");
    return;
  }
  submitJSON(e.target, "/borrowings", (f) => ({
    member_id: Number(f.get("member_id")),
    book_id: Number(f.get("book_id")),
    borrow_date: f.get("borrow_date"),
    due_date: f.get("due_date"),
  }), "Borrowing recorded.");
});

$("#category-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitJSON(e.target, "/categories", (f) => ({ name: f.get("name").trim() }), "Category added.");
});

$("#book-search").addEventListener("input", renderBooks);

const navLinks = document.querySelectorAll(".nav-link");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("#home, .section").forEach((s) => observer.observe(s));

loadAll();