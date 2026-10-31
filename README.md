# High Octane Dads Podcast Website

Official static site for the **High Octane Dads Podcast** hosted by **James Schoepf** and **Chris Mayo**—two dads who met through Mullet Militia over a shared love of third-gen F-bodies and twin LS-swapped 1986 Pontiac Trans Ams.

## Built With
- **[Astro](https://astro.build/)** — Ultra-fast static site generator
- **Live RSS Auto-Sync** ([`src/utils/rss.ts`](./src/utils/rss.ts)) — Automatically fetches all episodes, audio players, and timestamps from `https://anchor.fm/s/f221d764/podcast/rss` at build time
- **Netlify Forms & Config** ([`netlify.toml`](./netlify.toml)) — Zero-config deployment & contact form support

## Local Development

```bash
# Start local dev server at http://localhost:4321
npm run dev

# Build static production site into ./dist
npm run build
```

## Deploying to GitHub & Netlify
1. Push this repository to GitHub.
2. In **Netlify**, click **Add new site → Import an existing project** and select your GitHub repo.
3. Netlify will automatically read [`netlify.toml`](./netlify.toml) (`npm run build` → `dist`) and enable the **Pit Radio** contact form automatically.
