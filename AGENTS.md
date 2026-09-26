# SES-GPT Documentation

SES-GPT is a full-stack application consisting of a React + Vite + Tailwind CSS frontend and a Spring Boot (Java 21) backend.

## Architecture
- **Frontend**: React, Vite, Tailwind CSS v4. Runs on port 8443 (Figma Make) or standard Vite dev server.
- **Backend**: Spring Boot 3.x, Java 21, PostgreSQL with pgvector, LangChain4j for local ONNX embeddings.
- **Database**: PostgreSQL (Supabase/RDS/Local) with vector extension.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- **Backend**: Requires a running PostgreSQL instance. Start via `mvn spring-boot:run` in the `backend/` directory.
- **Environment**: Copy `.env.example` to `.env` and configure `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.

## Project Structure

This is the canonical structure:
- `backend/`: Spring Boot application (Java 21, Maven).
- `src/`: React frontend source code.
- `.figma/make/`: Figma Make configuration files.

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `s`

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.


## Backend Services

The repository now includes a Spring Boot backend that provides the following REST endpoints (extracted from the source tree):

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/v1/search` | Vector‑based document search powered by pgvector and LangChain4j embeddings |
| POST   | `/api/v1/feedback` | Store user feedback in PostgreSQL |
| GET    | `/api/v1/health` | Health‑check endpoint used by deployment platforms |

These endpoints are defined in `backend/src/main/java/com/sesgpt/controller/*`. The documentation previously only described the front‑end Vite app, so a new **Backend Services** section is added.

## Environment Variables

The `.env.example` file was truncated in the previous documentation. The full set of required variables is:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sesgpt
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password_here
SPRING_JPA_HIBERNATE_DDL_AUTO=update
VECTOR_DB_URL=jdbc:postgresql://localhost:5432/sesgpt
VECTOR_DB_USERNAME=postgres
VECTOR_DB_PASSWORD=your_password_here
```

The docs should reference these variables and note that they are loaded by Spring Boot at runtime.

## Docker Build & Deployment

A multi‑stage Dockerfile (`backend/Dockerfile`) now builds the Spring Boot JAR and packages it into a minimal JRE image. Add a **Docker Build** subsection:

```bash
docker build -t sesgpt-backend:latest -f backend/Dockerfile .
docker run -p 8080:8080 --env-file .env sesgpt-backend:latest
```

## CORS Configuration

The `CorsConfig` class (`backend/src/main/java/com/sesgpt/config/CorsConfig.java`) now explicitly allows origins for Vercel and Railway deployments. Document this in a **CORS** subsection and reference the source file.

## .gitignore Consolidation

Two `.gitignore` fragments were present. Consolidate them into a single file that includes both Node.js and Python artefacts, as well as the backend `target/` directory. Mention this cleanup in the **Repository Hygiene** section.

## Updated Styling Note

The documentation incorrectly referenced *Tailwind CSS v4*. The project uses Tailwind CSS v3 (the latest stable release). Update the version number accordingly.

---
### New Verified Subsystems
- Documented auto‑sync of `.figma/make` watch lists.
- Added backend Dockerfile, CORS config, and health‑check endpoint.
- Updated environment variable list and Tailwind version.
