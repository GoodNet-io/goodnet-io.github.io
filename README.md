# goodnet-io.github.io

Static landing page and interactive demo for the [GoodNet](https://github.com/GoodNet-io) org.
Deployed automatically to <https://goodnet-io.github.io/> on every push to `main`.

## Local development

```sh
npm install
npm run dev      # vite dev server with HMR
npm run build    # type-check + production bundle to dist/
npm run preview  # serve the built dist/ locally
```

Node 22 or newer.

## What lives where

- `index.html` — single-page layout (hero, demo, tech cards, repo grid, footer).
- `src/main.ts` — entry point: theme toggle, diagram inlining, repo grid, demo mount.
- `src/demo.ts` — live counter demo: WS connect via `goodnet-js` to a local
  `goodnetd`, with a same-origin `BroadcastChannel` fallback for offline visitors.
- `src/data/repos.ts` — repo catalogue rendered into the grid.
- `src/vendor/` — vendored copy of `goodnet-js` (will be replaced by an npm
  dependency once `goodnet-js@0.2.0` is published).
- `src/assets/architecture.svg` — kernel architecture diagram, inlined at build.
- `.github/workflows/pages.yml` — GitHub Pages build + deploy on push to `main`.

## License

MIT — see [LICENSE](./LICENSE).
