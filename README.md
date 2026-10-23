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

The Pages deployment configuration is defined in [`wrangler.toml`](./wrangler.toml), which points Pages to the Vite build output in `dist`. Use `npm run build:pages` as the Pages build command. The Express API server is not included in the static Pages deployment.

## Project scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the web app and server |
| `npm run build:pages` | Build the static web app for Cloudflare Pages |
| `npm start` | Run the production build |
| `npm run lint` | Run the TypeScript checks |
