# Budayana 3RA - AI Coding Instructions

## Project Overview

- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS v4 + Custom CSS files
- **Routing:** React Router DOM v7 (configured in `src/main.jsx`)
- **Authentication:** Better Auth (client in `src/lib/auth-client.ts`)
- **Key Libraries:** `turn.js` (flipbook), `jquery` (required for turn.js), `lucide-react` (icons)

## Architecture & Core Patterns

### Routing & Entry Point

- **Entry:** `src/main.jsx` is the main entry point and contains the **entire routing configuration**.
- **App Component:** `src/App.jsx` is currently unused/empty. Do not add routes there unless refactoring the entire app structure.
- **Route Structure:** Flat routing for:
  - Stories: `/cerita-rakyat/:island` -> `StoryBook[Island].jsx`
  - Games: `/:island-game` -> `[Island]Game.jsx`
  - Tests: `/pre-test-:island`, `/post-test-:island`
  - Auth: `/signin`, `/login`

### Flipbook Implementation (Critical)

- **Library:** Uses `turn.js` which depends on jQuery.
- **Loading:** jQuery and `turn.min.js` are loaded via **`<script>` tags in `index.html`**, not via ES modules.
- **Integration:**
  - jQuery is attached to `window.$` in components using it (e.g., `StoryBookJawa.jsx`).
  - **Do not remove** `const $ = window.$;` or jQuery imports in story components.
  - Flipbook data (pages, text) is currently hardcoded within the component files (e.g., `stories` object).

### Authentication

- **Client:** `src/lib/auth-client.ts` exports `authClient`.
- **Backend:** Points to `https://budayana-dusky.vercel.app/auth/api`.
- **Usage:** Import `authClient` for auth operations (login, signup, session).

## Styling Conventions

- **Tailwind v4:** Use Tailwind utility classes for new styling.
- **Legacy CSS:** Existing components use separate CSS files (e.g., `Home.css`, `Log_in.css`).
- **Strategy:** When modifying existing components, respect the existing CSS file imports. For new components, prefer Tailwind.

## File Naming & Structure

- **Components:** PascalCase (e.g., `StoryBookJawa.jsx`, `PreTestPapua.jsx`).
- **Assets:** Stored in `public/assets/budayana/`.
- **Islands:** Naming convention follows Indonesian island names (Jawa, Papua, Sulawesi, Sumatra).

## Development Workflow

- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint)

## Common Pitfalls

- **jQuery/React Conflict:** `turn.js` manipulates the DOM directly. Ensure `useEffect` or `useLayoutEffect` is used correctly to initialize/destroy the flipbook to avoid React rendering conflicts.
- **Asset Paths:** Always use absolute paths starting with `/` for public assets (e.g., `/assets/budayana/...`).
