# release-proxy

A lightweight Express proxy that exposes GitHub Releases over a simple REST API, keeping your GitHub token server-side.

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # development (nodemon)
npm start              # production
```

## Environment Variables

| Variable     | Required | Description                                                                                                                                |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GH_TOKEN`   | Yes      | GitHub Personal Access Token used to authenticate requests to the GitHub API. Needs `repo` scope (or `public_repo` for public repos only). |
| `REPO_OWNER` | Yes      | GitHub user or organization name that owns the repositories (e.g. `MY-COMPANY`).                                                           |
| `PORT`       | No       | Port the server listens on. Defaults to `3000`. Set automatically by Railway and other platforms.                                          |

Create a `.env` file in the project root:

```env
REPO_OWNER=your-org-or-username
GH_TOKEN=ghp_your_token_here
```

> **Never commit `.env` to version control.** Add it to `.gitignore`.

## API Endpoints

| Method | Path                                         | Description                                     |
| ------ | -------------------------------------------- | ----------------------------------------------- |
| `GET`  | `/api/v1/releases/:repo`                     | List all releases for a repo                    |
| `GET`  | `/api/v1/releases/:repo/latest`              | Get the latest release                          |
| `GET`  | `/api/v1/releases/:repo/has-update/:version` | Check if a newer version exists than `:version` |
| `GET`  | `/api/v1/releases/download/:repo/latest`     | Download the first asset of the latest release  |
| `GET`  | `/api/v1/releases/download/:repo/:assetId`   | Download a specific release asset by ID         |

### Example

```
GET http://localhost:3000/api/v1/releases/my-app/latest
GET http://localhost:3000/api/v1/releases/my-app/has-update/1.2.3
GET http://localhost:3000/api/v1/releases/download/my-app/latest
```
