# Gradebook Frontend (GitHub Pages)

This is a static frontend that can be deployed directly to GitHub Pages.

## Local development

```bash
cd frontend
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## How to use

1. Set **API Base URL** and click **Save API URL**.
2. Click **Test connection**.
3. Click **Find districts** to load valid `schoolDistrict` values from `/auth/districts`.
4. Login and use the data buttons (`Account`, `Grades`, `GPA`).

## Deployment

A GitHub Actions workflow is provided at `.github/workflows/deploy-frontend.yml`.
It publishes the `frontend/` directory to GitHub Pages.

## Merge conflicts (quick resolution guide)

If your branch conflicts while merging:

```bash
git fetch origin
git checkout <your-branch>
git merge origin/main
```

Then resolve files containing conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), stage, and commit:

```bash
git add <resolved-files>
git commit
```

Finally push your branch:

```bash
git push
```
