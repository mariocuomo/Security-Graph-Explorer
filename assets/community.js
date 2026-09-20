const grid = document.querySelector("#community-grid");
const emptyState = document.querySelector("#community-empty");
const errorState = document.querySelector("#community-error");
const searchInput = document.querySelector("#community-search-input");

let entries = [];

function renderCard(entry) {
  const card = document.createElement("article");
  card.className = "community-card";
  const tags = (entry.tags || []).map(tag => `<span class="community-tag">${tag}</span>`).join("");
  card.innerHTML = `
    <div class="community-card-head">
      <h3>${entry.name}</h3>
      <span class="community-date">${entry.submittedDate || ""}</span>
    </div>
    <p class="community-desc">${entry.description || ""}</p>
    <div class="community-tags">${tags}</div>
    <div class="community-meta">by ${entry.author || "Unknown"}${entry.githubHandle ? ` · <a href="https://github.com/${entry.githubHandle}" target="_blank" rel="noopener">@${entry.githubHandle}</a>` : ""}</div>
    <div class="community-actions">
      <button type="button" class="button primary community-copy">Copy import link</button>
      <a class="button" href="${entry.rawUrl}" download>Download</a>
    </div>
  `;
  card.querySelector(".community-copy").addEventListener("click", async event => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(entry.rawUrl);
      button.textContent = "Copied!";
    } catch {
      button.textContent = "Copy failed";
    }
    setTimeout(() => { button.textContent = "Copy import link"; }, 1800);
  });
  return card;
}

function renderList(list) {
  grid.innerHTML = "";
  list.forEach(entry => grid.appendChild(renderCard(entry)));
  emptyState.classList.toggle("is-visible", list.length === 0);
}

fetch("community-index.json")
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    entries = Array.isArray(data) ? data : [];
    renderList(entries);
  })
  .catch(() => {
    errorState.classList.add("is-visible");
  });

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) { renderList(entries); return; }
    renderList(entries.filter(entry => {
      const haystack = [entry.name, entry.description, entry.author, ...(entry.tags || [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    }));
  });
}
