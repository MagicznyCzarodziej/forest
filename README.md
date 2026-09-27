# Forest

Terminal UI for browsing GitHub repositories, cloning them into a structured layout, and opening git worktrees in IntelliJ IDEA.

## Requirements

- Node.js 20+
- `git`, `gh` (GitHub CLI), and `idea` on your PATH
- Config at `~/.config/forest/config.json`:

```json
{
  "root": "/Users/you/dev",
  "githubOwner": {
    "kind": "user",
    "login": "your-github-login"
  }
}
```

`kind` is `user` or `organization`. Optional `repoSlugSeparator` defaults to `__`, so a worktree folder is named `repo__branch`. Remote repo lists are cached per owner in `~/.config/forest/remote-repos-cache.json` (refreshed every 30 days).

## Install

From this repository, build and link the `forest` command onto your PATH:

```bash
npm install
npm run build
npm link
```

Then run `forest` from any directory. Quit with Ctrl+C.

After pulling changes, run `npm run build` again. `npm link` does not need to be repeated.

Remove the command with `npm unlink -g forest`.

## Development

```bash
npm test
npm run dev
```
