// server.js
import "dotenv/config";
import express from "express";
import { Readable } from "node:stream";

const app = express();
const GH_TOKEN = process.env.GH_TOKEN;
const owner = process.env.REPO_OWNER;

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`,
  );
  next();
});

app.get("/api/v1/releases/:repo", async (req, res) => {
  const { repo } = req.params;
  console.log(`[releases] Fetching releases for app: ${repo}`);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    console.log(
      `[releases] GitHub response status: ${response.status} for ${owner}/${repo}`,
    );
    const release = await response.json();
    res.json(release);
  } catch (err) {
    console.error(`[releases] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/releases/:repo/latest", async (req, res) => {
  const { repo } = req.params;
  console.log(`[releases] Fetching latest release for app: ${repo}`);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    console.log(
      `[releases] GitHub response status: ${response.status} for ${owner}/${repo}`,
    );
    const release = await response.json();
    res.json(release);
  } catch (err) {
    console.error(`[releases] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/releases/:repo/has-update/:version", async (req, res) => {
  const { repo, version } = req.params;
  console.log(
    `[has-update] Checking update for app: ${repo}, current version: ${version}`,
  );

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    console.log(
      `[has-update] GitHub response status: ${response.status} for ${owner}/${repo}`,
    );
    const release = await response.json();
    const latestVersion = release.tag_name?.replace(/^v/, "");
    const hasUpdate = latestVersion !== version;

    console.log(
      `[has-update] Latest: ${latestVersion}, current: ${version}, hasUpdate: ${hasUpdate}`,
    );
    res.json({ hasUpdate });
  } catch (err) {
    console.error(`[has-update] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/releases/download/:repo/latest", async (req, res) => {
  const { repo } = req.params;
  console.log(`[download] Request for app: ${repo}`);

  try {
    const releaseRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    const release = await releaseRes.json();
    const asset = release.assets?.[0];

    if (!asset) {
      console.warn(`[download-latest] No assets found for ${owner}/${repo}`);
      return res.status(404).json({ error: "No assets found" });
    }

    console.log(
      `[download-latest] Latest release: ${release.tag_name}, asset: ${asset.name} (id: ${asset.id})`,
    );

    const assetRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/octet-stream",
        },
      },
    );

    console.log(
      `[download-latest] GitHub asset response status: ${assetRes.status}, content-length: ${assetRes.headers.get("content-length")}`,
    );

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asset.name}"`,
    );
    const contentLength = assetRes.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const nodeStream = Readable.fromWeb(assetRes.body);
    nodeStream.pipe(res);
    nodeStream.on("end", () =>
      console.log(
        `[download-latest] Finished streaming ${asset.name} for ${repo}`,
      ),
    );
  } catch (err) {
    console.error(`[download-latest] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/v1/releases/download/:repo/:assetId", async (req, res) => {
  const { repo, assetId } = req.params;
  console.log(`[download] Request for app: ${repo}, assetId: ${assetId}`);

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`;
    console.log(`[download] Fetching asset from GitHub: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/octet-stream",
      },
    });

    console.log(
      `[download] GitHub response status: ${response.status}, content-length: ${response.headers.get("content-length")}`,
    );

    res.setHeader("Content-Type", "application/octet-stream");
    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
    nodeStream.on("end", () =>
      console.log(`[download] Finished streaming asset ${assetId} for ${repo}`),
    );
  } catch (err) {
    console.error(`[download] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`[server] Listening on port ${PORT}`),
);
