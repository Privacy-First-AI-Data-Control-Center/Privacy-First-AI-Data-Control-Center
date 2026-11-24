# Contributing to Privacy-First AI Data Control Center

Thank you for contributing to **Privacy-First AI Data Control Center**! This document defines our team workflow, branching strategy, coding standards, and Kanban board conventions.

---

## 1. Branching Strategy

We follow a structured integration workflow across two protected shared branches and individual developer/feature branches:

- **`main`** — Production-ready milestone releases only.
- **`dev`** — Active integration branch (default branch for day-to-day Pull Requests).
- **Developer / Feature Branches** — `shohag`, `ayan`, `ahnaf`, `munna`, or scoped feature branches (`feat/frontend-auth`, `fix/policy-sync`, etc.).

### Standard Workflow

```bash
# 1. Sync latest dev branch
git checkout dev
git pull origin dev

# 2. Switch to your branch and rebase/merge latest dev
git checkout <your-branch>
git merge dev

# 3. Commit atomic, well-described changes
git add .
git commit -m "feat(frontend): add workspace switcher and role guard"

# 4. Push and open a Pull Request into dev
git push origin <your-branch>
```

---

## 2. Kanban Board & Issue Linking

All Frontend, Backend, and Local Agent tasks are tracked on our **GitHub Project Board**:

1. Pick or create an Issue using one of our templates in `.github/ISSUE_TEMPLATE/`.
2. Move the card to **`In Progress`** when you start coding.
3. Reference the Issue number in your Pull Request description (e.g., `Closes #21`) so merging the PR automatically moves the card to **`Done`**.

---

## 3. Commit Message Conventions

Use clear [Conventional Commits](https://www.conventionalcommits.org/) prefixes:

- `feat(scope):` — New screen, API endpoint, or agent capability
- `fix(scope):` — Bug fix or validation correction
- `docs:` — Documentation, architecture diagrams, or comments
- `refactor(scope):` — Code cleanup with no behavior change
- `test(scope):` — Unit, integration, or E2E tests
- `chore:` — Build scripts, dependencies, or CI configuration

---

## 4. Pre-PR Verification Checklist

Before opening a Pull Request into `dev`, verify your changes locally:

### Backend (`backend/`)
```bash
cd backend
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Local Agent (`local-agent/`)
```bash
cd local-agent
npm run typecheck
npm run build
npm test
```

### Frontend (`frontend/` — once initialized)
```bash
cd frontend
npm run lint
npm run build
```

### Secret Hygiene
- **Never** commit `.env` files, database URLs, JWT secrets, or OAuth tokens.
- Ensure any sample configuration uses placeholder values in `.env.example` or `README.md`.
