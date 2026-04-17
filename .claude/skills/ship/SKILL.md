---
name: ship
description: Commit, push to GitHub, and build+push Docker images in one workflow
disable-model-invocation: true
argument-hint: "[commit message]"
---

# Ship Workflow

Run the full ship workflow: commit all changes, push to GitHub, and build+push Docker multi-arch images.

## Steps

1. **Review changes**: Run `git status` and `git diff --stat` to see what will be committed. Also run `git log --oneline -5` to see recent commit style.

2. **Commit**:
   - If the user provided a commit message via `$ARGUMENTS`, use it directly.
   - If no message was provided, analyze the changes and draft a concise commit message (1-2 sentences, imperative mood, focusing on "why" not "what").
   - Stage all modified and untracked files that are relevant (never stage .env files or credentials).
   - Commit with the message, ending with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
   - Use a HEREDOC for the commit message to ensure proper formatting.

3. **Push to GitHub**: Run `git push` to push the commit to the remote.

4. **Build and push Docker images**: Run `./build-and-push.sh` in the background. Report when complete.
   - This builds multi-arch images (amd64 + arm64) for all four services and pushes to Docker Hub.

5. **Report**: Summarize what was committed, the commit hash, and confirm the Docker images were pushed. Remind the user to pull and restart on the NAS:
   ```
   docker compose -f docker-compose.nas.yml pull
   docker compose -f docker-compose.nas.yml up -d
   ```

## Important
- If there are no changes to commit, skip the commit step and just build+push.
- Never commit files that contain secrets (.env, credentials, tokens).
- If the build fails, report the error clearly.
