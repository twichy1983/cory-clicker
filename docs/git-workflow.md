# Git workflow

A simple workflow for a small project: `main` is always playable, and changes happen on short-lived branches.

## Branches

| Branch | Purpose |
|---|---|
| `main` | What's live. GitHub Pages serves it, so **every push to `main` goes live** within a few minutes. |
| `feature/<name>`, `fix/<name>` | One change each, such as `feature/new-industry` or `fix/shell-game-labels`. Merge to `main` when it's done. |

## Making a change

```sh
git switch main
git pull
git switch -c fix/short-description

# ...edit, then check:
npm test
npm run test:e2e

git add -A
git commit -m "Fix the shell game giving away the answer"
git push -u origin fix/short-description
```

Then either open a pull request on GitHub and merge it there, or merge locally:

```sh
git switch main
git merge fix/short-description
git push
git branch -d fix/short-description
```

## Before merging to `main`

- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] You played the change in `npm run dev`
- [ ] If you changed the layout: checked `npm run screenshots`, or resized the browser
- [ ] If you changed the save format: an old save still loads (see [Making changes](making-changes.md#change-the-save-format))

## Commit messages

Follow the style already in the history:

- **First line:** what the commit does, in the imperative, under about 70 characters. For example "Add jobs: a minigame per industry" or "Fix fines counting twice after import".
- **Then**, after a blank line, *why*, if it isn't obvious. Use bullet points for several changes.
- Keep each commit to one change. "Rebalance pharma" and "Fix tooltip position" are two commits.

## What's not in git

`node_modules/`, `dist/` (build output) and `screenshots/` are ignored (see `.gitignore`). Never commit them. They're recreated by `npm install`, `npm run build` and `npm run screenshots`.

## Line endings on Windows

`.gitattributes` makes Git store every text file with LF line endings, so Windows and macOS commits don't fight over them. If Git warns about CRLF, it's handling it. Most editors read `.editorconfig` and use LF automatically (VS Code does).

## Undoing things

| Situation | Command |
|---|---|
| Discard uncommitted changes to a file | `git restore path/to/file` |
| Undo the last commit but keep the changes | `git reset --soft HEAD~1` |
| Undo a commit that's already pushed | `git revert <commit>` (makes a new commit; never rewrite `main`'s history) |
