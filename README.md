# TaxEase

Income tax estimator with a step-by-step explanation. Static site: HTML, CSS and JavaScript, no build step.

## Deploy on GitHub Pages
1. Push these files to the root of a repository named `TaxEase` on the `main` branch.
2. In the repository, open Settings, then Pages. Set Source to "Deploy from a branch", choose `main` and `/ (root)`, and save.
3. Your site appears at `https://<username>.github.io/TaxEase/`.

If you rename the repository or use a custom domain, update the link in `404.html`.

## Updating tax rules
Slabs, rebate limits, surcharge and cess are in the `CFG` block at the top of `app.js`.
