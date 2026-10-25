# MarkItDown

MarkItDown is a web app for converting documents and web pages into clean Markdown. Review and edit the result in the browser, then copy it or download it for your own notes and projects.

## Features

- Convert uploaded documents, spreadsheets, data files, images, and text-based files to Markdown.
- Fetch a web page and convert its content to Markdown.
- Choose an output style, including standard Markdown, LaTeX-friendly formatting, or a summary.
- Preview and edit the generated Markdown before exporting.
- Copy the result or download it as a `.md` or `.tex` file.
- View conversion statistics such as word count, headings, and tables.

## Requirements

- Node.js
- npm

## Run locally

1. Clone the repository and open its directory:

   ```sh
   git clone git@github.com:mherub004/markitdown.git
   cd markitdown
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Build and run

Create a production build:

```sh
npm run build
```

Start the built app:

```sh
npm start
```

## Cloudflare Pages

Deploy this repository as a **Cloudflare Pages** project using:

- Production branch: `main`
- Build command: `npm run build:pages`
- Build output directory: `dist`
- Root directory: the repository root
- Node.js version: 22 or newer

Install dependencies with `bun install --frozen-lockfile` to use the committed lockfile. In Pages build settings, set `SKIP_DEPENDENCY_INSTALL=1` and use `bun install --frozen-lockfile && npm run build:pages` as the build command if automatic installation is enabled. Pin `BUN_VERSION=1.3.11` for the tested tool version.

Pages Functions in `functions/api` provide health checks, native document conversion, and web URL conversion. `wrangler.toml` enables Node.js compatibility for the document parser. Gemini AI is available only through the Express server; the Pages API uses the native engine without credentials. Native PDF and image conversion retains the existing engine's extraction limitations.

Do not deploy the repository root as static files or use the committed `dist` snapshot without rebuilding: the HTML and hashed assets must come from the same build. Deploy from the repository root so Pages also discovers `functions`.

After a successful Pages deployment, open **Workers & Pages → markitdown → Custom domains → Set up a custom domain** and enter `markitdown.iamahsan.org`. Follow Cloudflare's DNS instructions and wait for the domain and certificate to become active. If DNS is hosted elsewhere, use the CNAME target shown by Pages. Verify the generated `*.pages.dev` URL first, then the custom domain and `/api/health`. A DNS record alone does not attach a hostname to a Pages project.

For a local Pages preview, build the frontend and run `wrangler pages dev dist` from the repository root. To deploy using an authenticated Wrangler installation, run `wrangler pages deploy dist --project-name markitdown` from the repository root. This requires Cloudflare account access; never commit API tokens.

With the local Pages server running on port 8788, run `node scripts/smoke-pages.mjs` to check frontend assets, health, HTML/CSV/DOCX conversion, and missing-input errors. To check a deployed site, pass its HTTPS address as the first argument.

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the web app and server |
| `npm run build:pages` | Build the static web app for Cloudflare Pages |
| `npm start` | Run the production build |
| `npm run lint` | Run the TypeScript checks |
