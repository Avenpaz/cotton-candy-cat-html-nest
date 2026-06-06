# Cat HTML Nest

A soft mobile HTML mini-game vault for saving and launching personal standalone HTML games.

Cat HTML Nest is a static, phone-first web app. Paste complete HTML games generated elsewhere, save them as cozy cards, and tap **Run** later to open a saved game in a full new browser tab.

## What it does

- Saves standalone HTML mini-games in your browser with `localStorage`.
- Stores games under the key `cottonCandyCatHtmlNest.games`.
- Lets you add a title, optional description, optional tags, and the exact pasted HTML.
- Supports search, edit, duplicate, delete, JSON export, and JSON import.
- Opens saved games in a new tab using a browser-native Blob URL.

Saved game objects use this shape:

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "html": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## How to use

1. Open `index.html` on your phone or from a hosted static site.
2. Enter a title.
3. Optionally add a description and comma-separated tags.
4. Paste a complete standalone HTML mini-game.
5. Tap **Save game**.
6. Tap **Run** on any saved card to launch it in a full new tab.

The app is not a developer code editor. It is meant for pasting complete HTML and playing.

## Local storage

Games are stored only in the current browser's `localStorage` under:

```text
cottonCandyCatHtmlNest.games
```

There is no backend, account system, external database, or build step. Data stays in the browser where you saved it.

Mobile browsers may clear `localStorage` under storage pressure, during browser cleanup, or when site data is removed. Export JSON backups regularly.

## Export and import backups

Open **Backups** in the app:

- **Export JSON** downloads all saved games as a backup file.
- **Import JSON** reads a backup file and asks whether to merge it into the current shelf or replace all current games.

Keep exported JSON files somewhere safe if the games matter to you.

## Run locally

No installation is required. Open `index.html` directly in a browser.

Some mobile browsers apply stricter rules to files opened directly from local storage. If a feature is limited, host the folder as a static site or use GitHub Pages.

## GitHub Pages

This app is ready to publish from the repository root on the `main` branch.

If GitHub Pages is not configured automatically:

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Set the source to **Deploy from branch**.
5. Choose **main** and **root**.
6. Save.

## Mobile browser notes

- The app is designed for iPhone-sized mobile browsers.
- Running games opens a new tab and may require popups to be allowed for the site.
- Pasted HTML is preserved exactly in storage.
- Pasted HTML is executed only when you tap **Run**.
- Export JSON backups regularly because browser storage is not permanent archival storage.
