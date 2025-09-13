# AdBlock Test

<p align="center">
  <img src="src/assets/adblock/icon.svg" alt="AdBlock Test" width="128" height="128" />
</p>

A lightweight web app to evaluate how well your ad-blocker works by attempting requests to common ad, analytics, tracking, and social domains and summarizing the results.

## Build & Run

- Dev server: `npm run dev` then open `http://localhost:3000/adblock.html`
- Production build: `npm run build` (outputs to `dist`)
- Purge unused CSS after build: `npm run purge`

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds on pushes to `main` and publishes the `dist` folder to `gh-pages`. Ensure your repository Pages is set to deploy from the `gh-pages` branch.

## d3Host Lists

If you want to improve coverage, you can use the generated host lists in this repo:
- Plain hosts: `src/d3host.txt`
- Adblock format: `src/d3host.adblock`

## Contributing

Issues and improvements for the AdBlock Test are welcome.

## License

Licensed under [(CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
