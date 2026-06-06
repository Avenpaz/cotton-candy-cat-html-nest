"use strict";

const STORAGE_KEY = "cottonCandyCatHtmlNest.games";

const form = document.querySelector("#gameForm");
const titleInput = document.querySelector("#titleInput");
const descriptionInput = document.querySelector("#descriptionInput");
const tagsInput = document.querySelector("#tagsInput");
const htmlInput = document.querySelector("#htmlInput");
const searchInput = document.querySelector("#searchInput");
const cardsList = document.querySelector("#cardsList");
const emptyState = document.querySelector("#emptyState");
const gameCount = document.querySelector("#gameCount");
const statusMessage = document.querySelector("#statusMessage");
const editBadge = document.querySelector("#editBadge");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");

let games = loadGames();
let editingId = null;

render();

form.addEventListener("submit", handleSubmit);
searchInput.addEventListener("input", render);
cancelEditButton.addEventListener("click", cancelEdit);
exportButton.addEventListener("click", exportGames);
importInput.addEventListener("change", importGames);

function loadGames() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isUsableGame) : [];
  } catch (error) {
    showStatus("The nest could not read saved games from this browser.");
    return [];
  }
}

function saveGames() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const html = htmlInput.value;

  if (!title) {
    showStatus("Please add a title before saving.");
    titleInput.focus();
    return;
  }

  if (!html.trim()) {
    showStatus("Please paste standalone HTML before saving.");
    htmlInput.focus();
    return;
  }

  const now = new Date().toISOString();
  const nextGame = {
    id: editingId || createId(),
    title,
    description: descriptionInput.value.trim(),
    tags: parseTags(tagsInput.value),
    html,
    createdAt: now,
    updatedAt: now
  };

  if (editingId) {
    const existing = games.find((game) => game.id === editingId);
    nextGame.createdAt = existing ? existing.createdAt : now;
    games = games.map((game) => (game.id === editingId ? nextGame : game));
  } else {
    games = [nextGame, ...games];
  }

  saveGames();
  form.reset();
  setEditMode(null);
  render();
  showStatus("Cache hit - your little game is safe in the 猫窝.");
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleGames = games.filter((game) => matchesSearch(game, query));

  cardsList.replaceChildren();
  gameCount.textContent = String(visibleGames.length);
  emptyState.hidden = visibleGames.length > 0;

  visibleGames.forEach((game) => {
    cardsList.appendChild(createGameCard(game));
  });
}

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  const title = document.createElement("h3");
  title.textContent = game.title;
  card.appendChild(title);

  if (game.description) {
    const description = document.createElement("p");
    description.className = "game-description";
    description.textContent = game.description;
    card.appendChild(description);
  }

  if (game.tags.length > 0) {
    const tags = document.createElement("div");
    tags.className = "tags";
    game.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = tag;
      tags.appendChild(pill);
    });
    card.appendChild(tags);
  }

  const meta = document.createElement("p");
  meta.className = "game-meta";
  meta.textContent = `Saved ${formatDate(game.createdAt)} · Updated ${formatDate(game.updatedAt)}`;
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  actions.appendChild(makeButton("Run", "run-button", () => runGame(game)));
  actions.appendChild(makeButton("Edit", "soft-button", () => startEdit(game)));
  actions.appendChild(makeButton("Duplicate", "soft-button", () => duplicateGame(game)));
  actions.appendChild(makeButton("Delete", "delete-button", () => deleteGame(game)));

  card.appendChild(actions);
  return card;
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function runGame(game) {
  const blob = new Blob([game.html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener");

  if (!opened) {
    URL.revokeObjectURL(url);
    showStatus("The new tab was blocked. Please allow popups for this site, then tap Run again.");
    return;
  }

  showStatus("Opening your saved game in a new tab.");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function startEdit(game) {
  titleInput.value = game.title;
  descriptionInput.value = game.description;
  tagsInput.value = game.tags.join(", ");
  htmlInput.value = game.html;
  setEditMode(game.id);
  showStatus("Edit mode is active for this saved game.");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  form.reset();
  setEditMode(null);
  showStatus("Edit mode canceled.");
}

function setEditMode(id) {
  editingId = id;
  const isEditing = Boolean(id);
  editBadge.hidden = !isEditing;
  cancelEditButton.hidden = !isEditing;
  saveButton.textContent = isEditing ? "Save changes" : "Save game";
}

function duplicateGame(game) {
  const now = new Date().toISOString();
  const copy = {
    ...game,
    id: createId(),
    title: `${game.title} copy`,
    createdAt: now,
    updatedAt: now
  };

  games = [copy, ...games];
  saveGames();
  render();
  showStatus("A soft little duplicate has joined the shelf.");
}

function deleteGame(game) {
  const confirmed = window.confirm(`Delete "${game.title}" from Cat HTML Nest?`);
  if (!confirmed) {
    return;
  }

  games = games.filter((item) => item.id !== game.id);
  if (editingId === game.id) {
    cancelEdit();
  }
  saveGames();
  render();
  showStatus("Game deleted.");
}

function exportGames() {
  const payload = JSON.stringify(games, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `cat-html-nest-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showStatus("Backup exported as JSON.");
}

function importGames(event) {
  const file = event.target.files[0];
  event.target.value = "";

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const imported = normalizeImport(parsed);

      if (imported.length === 0) {
        showStatus("No usable games were found in that JSON file.");
        return;
      }

      const merge = window.confirm("Import backup: OK merges with this shelf. Cancel replaces everything.");
      games = merge ? mergeGames(games, imported) : imported;
      saveGames();
      setEditMode(null);
      form.reset();
      render();
      showStatus(merge ? "Backup merged into the nest." : "Backup replaced this shelf.");
    } catch (error) {
      showStatus("That JSON backup could not be imported.");
    }
  });

  reader.readAsText(file);
}

function normalizeImport(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isUsableGame).map((game) => ({
    id: String(game.id || createId()),
    title: String(game.title).trim(),
    description: String(game.description || ""),
    tags: Array.isArray(game.tags) ? game.tags.map(String).filter(Boolean) : [],
    html: String(game.html),
    createdAt: validDate(game.createdAt) ? game.createdAt : new Date().toISOString(),
    updatedAt: validDate(game.updatedAt) ? game.updatedAt : new Date().toISOString()
  }));
}

function mergeGames(current, imported) {
  const seen = new Set(current.map((game) => game.id));
  const incoming = imported.map((game) => {
    if (!seen.has(game.id)) {
      seen.add(game.id);
      return game;
    }

    const copy = { ...game, id: createId(), updatedAt: new Date().toISOString() };
    seen.add(copy.id);
    return copy;
  });

  return [...incoming, ...current];
}

function matchesSearch(game, query) {
  if (!query) {
    return true;
  }

  return [game.title, game.description, ...game.tags]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `game-${Date.now().toString(36)}-${random}`;
}

function isUsableGame(game) {
  return Boolean(
    game &&
      typeof game === "object" &&
      String(game.title || "").trim() &&
      typeof game.html === "string" &&
      game.html.trim()
  );
}

function validDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function formatDate(value) {
  if (!validDate(value)) {
    return "unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function showStatus(message) {
  statusMessage.textContent = message;
}
