# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A plain HTML/CSS/JavaScript to-do list app. No frameworks, no build tools, no package manager — just three static files opened directly in a browser:

- `index.html` — markup/layout
- `style.css` — styling
- `app.js` — application logic

There is no build, lint, or test tooling in this repo. To view the app, open `index.html` directly in a browser (or serve the folder with any static file server); there is no compile step.

## Staged development plan

This project is being built incrementally by feeding numbered prompts (in Korean) to Claude Code, one per stage. The prompts live in `prompts/1.prompt.md` through `prompts/5.prompt.md` and define the intended end state — read them before making structural changes, since later stages assume earlier ones are already in place:

1. **`1.prompt.md`** — static markup + CSS layout only (header with title/progress area, input area, filter tabs, empty `#todo-list`). No JS logic yet; only the CSS class structure for per-category coloring is prepared.
2. **`2.prompt.md`** — core data logic in `app.js`, in-memory only (no persistence yet): add, render, toggle-complete, inline edit, delete. Empty-title entries must be rejected.
3. **`3.prompt.md`** — category filtering (전체/업무/개인/공부 tabs) and progress display (count + percentage). Progress is always computed from the full todo list, not the filtered view, and must update immediately on any state change. Filter logic and render logic must stay separate so switching filters never mutates the underlying data.
4. **`4.prompt.md`** — `localStorage` persistence under the key `"todos"` (JSON-serialized array). Save on every mutation (add/edit/delete/toggle); load on page start; wrap parsing in try/catch and fall back to an empty array on corrupt/invalid data.
5. **`5.prompt.md`** — polish pass: responsive layout down to ~480px, clearer category color tags, empty-state message when the list/filter has no results, keyboard accessibility (Enter to add, Tab to reach checkboxes), and a final dedup/cleanup pass. The prompt's own suggestion of auto-sorting completed items to the bottom of the same list (marked optional there) was superseded by a later, more specific user request — see below.

As of the last update, all five stages have been implemented.

Note: stage 4 persists the todo array under `localStorage["todos"]` as required, and additionally persists the active filter tab under a second key, `localStorage["todoFilter"]`, so the selected filter also survives a page reload — this second key isn't mandated by `4.prompt.md`'s requirement list but was added because that prompt's own verification step asks to confirm filter selection also survives a refresh.

## Data model

Todo items follow this shape (see `2.prompt.md`):

```
{
  id: string,
  title: string,
  category: "업무" | "개인" | "공부",
  completed: boolean,
  createdAt: string   // ISO 8601
}
```

## Completed items live in a separate collapsible section, not inline

Completed to-dos are not shown inline (sorted to the bottom) in `#todo-list` — they are split out entirely into a separate "완료된 항목" (Completed items) section below the main list, collapsed by default, that the user expands by clicking `#completed-toggle`. This was a deliberate follow-up request after the stage-5 pass initially implemented inline bottom-sorting instead; the inline approach was replaced, not layered on top of it. Key pieces in `app.js`:

- `renderTodos()` splits the current filter's matches into `activeTodos` (rendered into `#todo-list`) and `completedTodos` (rendered into `#completed-list` via `renderCompletedList()`), rather than sorting one combined list.
- `showCompleted` (module-level boolean, default `false`) tracks whether the section is expanded; `toggleCompletedSection()` flips it and toggles the `.collapsed` class on `#completed-list` plus `aria-expanded` on the toggle button.
- The empty-state message in the main list now distinguishes "no matching to-dos at all" from "everything in this filter is done" (the latter points the user at the completed section) — see `createEmptyStateEl()`.
- Un-checking a completed item (from inside the completed section) moves it back into the main list on the next render automatically, since both lists are derived fresh from `todos` on every `renderTodos()` call.

## Markup/CSS conventions established in stage 1

- Category values map to CSS classes `category-work`, `category-personal`, `category-study` (English) applied to `.todo-item` elements, driving `border-left` color and the `.todo-item-category` badge background — even though the data model's `category` field itself is Korean (`"업무" | "개인" | "공부"`). When generating an item's DOM in `app.js`, map the Korean category value to the corresponding English class name.
- Filter tab buttons use `data-filter` attributes with the English values (`all`, `work`, `personal`, `study`); the active tab gets the `.filter-btn.active` class.
- Progress UI: `#progress-text` (text like `"12개 중 7개 완료 (58%)"`) and `#progress-bar-fill` (width-based fill bar) inside `.progress-area`.

## Other repo state

- `.claude/settings.json` sets `defaultMode: "acceptEdits"` and requires confirmation for `git push`, `git commit`, and `rm -rf`.
- Root also contains dated planning notes (e.g. `260819.md`) mirroring the content of the numbered prompt files.
