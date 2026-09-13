# SAPUDOM GitHub Pages deployment fix

## Why the previous deployment showed a white page
The repository contains TypeScript (`main.ts`) and npm package imports such as `vanjs-core` and `@sapudom/components`.
GitHub Pages is a static file host and does not run Vite or npm automatically. Publishing the source tree directly makes the browser try to load the unbuilt source, so the application fails before the UI mounts.

## Correct deployment
This version includes:
- `vite.config.ts` with relative asset paths (`base: "./"`)
- `.github/workflows/deploy-pages.yml` to install dependencies, run `vite build`, upload `dist`, and deploy the generated site

## GitHub Settings
1. Push all files to the repository's `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open **Actions** and wait for **Deploy SAPUDOM to GitHub Pages** to finish successfully.
5. Open the URL shown in the deployment result.

Do not choose "Deploy from a branch" for the raw source tree unless you manually commit the contents of `dist` to the published branch.
