# Launchpad — GitHub Pages setup page

A buildless, single-page installation menu inspired by GitHub's dark interface. A centered panel up to 1000 px wide sits above an animated dark grid background. Large desktop screens use larger type and spacing; short windows use compact layouts to keep the menu visible without page scrolling. All visitor-facing text is English. This is an independent project, not an official GitHub page.

## Configure

Edit `config.js`:

```js
window.SITE_CONFIG = {
  brand: "Your app",
  owner: "", // Automatically detected on GitHub Pages
  project: "", // Automatically detected on GitHub Pages
  description: "Your project description.",
  repositoryUrl: "", // Set a GitHub repository URL when using a custom domain
  commands: {
    standard: "https://your-domain.com/command.txt",
    policy: "https://your-domain.com/command-policy.txt"
  }
};
```

The two URLs must return the complete commands as UTF-8 plain text, without Markdown fences or HTML. Each tab displays and copies its own source text; the page does not generate, modify, or execute PowerShell. URLs are deliberately empty until you supply real sources.

## Automatic repository name

On `https://username.github.io/repository/`, the page displays `username / repository` and links to the corresponding GitHub repository. At `https://username.github.io/` (or `/index.html`), it displays `username / username.github.io`. This follows the standard [GitHub Pages URL structure](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#types-of-github-pages-sites). It detects the repository owner (a user or organization), not the historical creator or commit author, and does not require API calls or tokens.

On a custom domain or localhost, set `repositoryUrl` to `https://github.com/owner/repository` to derive both labels. Optional `owner` and `project` values override detection. Without a detectable URL or overrides, local preview shows neutral labels until deployed.

Cross-origin sources must allow browser requests, for example with `Access-Control-Allow-Origin: *`. A raw file on `raw.githubusercontent.com` can be used. Do not put secrets in these files: all content and configuration are public. Commands have a 32 KB limit and requests time out after 12 seconds.

## Publish on GitHub Pages

1. Upload `index.html`, `style.css`, `app.js`, `config.js`, `favicon.svg`, `.nojekyll`, and `THIRD_PARTY_NOTICES.txt` to the repository root. `icons.svg` is included as an optional source reference; the page does not load it.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your branch (usually `main`), choose **/(root)**, and save.
5. Open the URL provided by GitHub Pages when deployment finishes.

Both `https://username.github.io/` and `https://username.github.io/repository/` work because all asset paths are relative. No framework, package installation, server, or build step is needed. Extract the ZIP before uploading; uploading the ZIP alone does not deploy the page.

## Local preview

Run `python -m http.server 8080` in this folder, then open `http://localhost:8080`. Clipboard access works on HTTPS and localhost. When clipboard access is unavailable, the command is selected for manual copying.

The opening instruction is **Win + X → PowerShell (Administrator)**. Windows 11 may label this entry **Terminal (Admin)**; select it and open a PowerShell tab. This alternative is also in the first step's tooltip. The Execution policy tab is marked **If the default fails**. The command display has no shell prompt, so manual selection contains only command text.

At viewport widths up to 760 px, or on touch devices up to 1100 px wide, the installation menu is replaced with a desktop-only download notice. Detection is based on media queries; it is a presentation aid rather than device authentication. Very small windows and browser zoom can still scroll to keep all text accessible.

Animations include panel entrance, staggered steps, subtle background glow, method transitions, loading indicators, and copy confirmation. The visitor's reduced-motion preference disables decorative motion.

## Icons

All pictograms use [GitHub Octicons](https://github.com/primer/octicons), including the terminal illustration, favicon, copy button, links, and mobile notice. Each page icon embeds its SVG paths directly in `index.html`, so icons also render when the HTML file is opened directly from disk. No external sprite, CDN, JavaScript icon loader, or icon font is required. `icons.svg` is only an optional source reference. Keep the MIT license in `THIRD_PARTY_NOTICES.txt` when distributing the files.

## Compact command row

The command stays on one line, with horizontal scrolling for long commands. Its row uses 48 px on regular desktops, 60 px on large screens, and 44 px in short windows. Copying still includes the entire command.

To restore the earlier, taller command area, replace `style.css` with `backups/style-before-compact-command.css` (keep the filename `style.css`). The backup preserves the complete stylesheet from before this change.
