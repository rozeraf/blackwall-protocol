# Agent Instructions — blackwall-protocol

## Runtime & Package Manager

This project uses **[Bun](https://bun.sh)** as the runtime and package manager.

### Key Bun commands

| Task | Command |
|------|---------|
| Run a script | `bun run <script>` |
| Run a file directly | `bun run index.ts` |
| Install dependencies | `bun install` |
| Add a package | `bun add <package>` |
| Add a dev dependency | `bun add -d <package>` |
| Remove a package | `bun remove <package>` |
| Run tests | `bun test` |
| Build | `bun build ./index.ts --outdir ./dist` |
| Execute a one-off script | `bun x <cli-tool>` |

> **Never use `npm`, `yarn`, or `pnpm`** — always use `bun`.

---

## Git Commits — Conventional Commits

When asked to make a commit, follow these steps:

1. **Check status & diff first:**
   ```bash
   git status
   git diff --staged   # or git diff HEAD if nothing is staged yet
   ```

2. **Stage relevant files** if not already staged.

3. **Write a commit message** following [Conventional Commits](https://www.conventionalcommits.org/) format:

   ```
   <type>(<optional scope>): <short description>

   [optional body]

   [optional footer(s)]
   ```

   Common types:

   | Type | When to use |
   |------|-------------|
   | `feat` | A new feature |
   | `fix` | A bug fix |
   | `chore` | Maintenance, tooling, config |
   | `docs` | Documentation only |
   | `refactor` | Code restructure without behaviour change |
   | `test` | Adding or updating tests |
   | `style` | Formatting, linting (no logic change) |
   | `perf` | Performance improvement |
   | `ci` | CI/CD changes |
   | `build` | Build system changes |

4. **Commit:**
   ```bash
   git add <files>
   git commit -m "<type>(<scope>): <description>"
   ```

### Examples

```
chore: initialise bun project
feat(auth): add JWT token validation
fix(api): handle empty response from upstream
docs: update README with setup instructions
```
