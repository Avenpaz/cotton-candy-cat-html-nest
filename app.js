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
    showStatus("这个浏览器里的猫窝数据暂时读不出来。");
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
    showStatus("名字不能为空。");
    titleInput.focus();
    return;
  }

  if (!html.trim()) {
    showStatus("HTML 代码不能为空。");
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
  showStatus("缓存命中——小游戏已经乖乖躺进猫窝啦。");
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
  meta.textContent = `存入 ${formatDate(game.createdAt)} · 更新 ${formatDate(game.updatedAt)}`;
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  actions.appendChild(makeButton("开始玩", "run-button", () => runGame(game)));
  actions.appendChild(makeButton("修改", "soft-button", () => startEdit(game)));
  actions.appendChild(makeButton("复制", "soft-button", () => duplicateGame(game)));
  actions.appendChild(makeButton("删除", "delete-button", () => deleteGame(game)));

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
    showStatus("新页面被浏览器拦住了，请允许这个网站打开弹出页面。");
    return;
  }

  showStatus("正在新页面打开这个小游戏。");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function startEdit(game) {
  titleInput.value = game.title;
  descriptionInput.value = game.description;
  tagsInput.value = game.tags.join(", ");
  htmlInput.value = game.html;
  setEditMode(game.id);
  showStatus("正在修改这个小游戏。");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  form.reset();
  setEditMode(null);
  showStatus("已取消编辑。");
}

function setEditMode(id) {
  editingId = id;
  const isEditing = Boolean(id);
  editBadge.hidden = !isEditing;
  cancelEditButton.hidden = !isEditing;
  saveButton.textContent = isEditing ? "保存修改" : "存进猫窝";
}

function duplicateGame(game) {
  const now = new Date().toISOString();
  const copy = {
    ...game,
    id: createId(),
    title: `${game.title} 副本`,
    createdAt: now,
    updatedAt: now
  };

  games = [copy, ...games];
  saveGames();
  render();
  showStatus("已经复制一份到玩具架上。");
}

function deleteGame(game) {
  const confirmed = window.confirm(`要删除「${game.title}」这个小游戏吗？`);
  if (!confirmed) {
    return;
  }

  games = games.filter((item) => item.id !== game.id);
  if (editingId === game.id) {
    cancelEdit();
  }
  saveGames();
  render();
  showStatus("小游戏已删除。");
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
  showStatus("备份已经导出。");
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
        showStatus("这个 JSON 里没有找到可用的小游戏。");
        return;
      }

      const merge = window.confirm("导入备份：点“确定”和现有小游戏合并；点“取消”会替换掉现在所有小游戏。");
      games = merge ? mergeGames(games, imported) : imported;
      saveGames();
      setEditMode(null);
      form.reset();
      render();
      showStatus(merge ? "备份已经合并进猫窝。" : "备份已经替换当前玩具架。");
    } catch (error) {
      showStatus("这个 JSON 备份导入失败。");
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
    return "未知时间";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function showStatus(message) {
  statusMessage.textContent = message;
}
