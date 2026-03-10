# Gradebook Frontend (GitHub Pages)

This is a static frontend that can be deployed directly to GitHub Pages.

## Local development

```bash
cd frontend
python3 -m http.server 4173
```

Then open `http://localhost:4173` and set your backend URL in the app.

On the login card, click **Find districts** to load supported `schoolDistrict` values from `/auth/districts`.

## Deployment

A GitHub Actions workflow is provided at `.github/workflows/deploy-frontend.yml`.
It publishes the `frontend/` directory to GitHub Pages.
