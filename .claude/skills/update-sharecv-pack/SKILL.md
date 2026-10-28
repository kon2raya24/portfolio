---
name: update-sharecv-pack
description: Regenerate sharecv-import.txt from resume.json and re-sync the user's public ShareCV profile (https://sharecv.technolympus.com/p/lemmuel-turaya, Modern Sidebar template) through ShareCV's "Onboard with AI" import. Run whenever resume.json changes recruiter-visible content — new role, new project or case study, summary reframing, skills change. Chained from update-resume next to update-linkedin-pack.
---

# update-sharecv-pack

ShareCV's "Onboard with AI" step accepts a structured text payload and replaces every profile field the template covers. `sharecv-import.txt` is that payload, generated from `resume.json` (the source of truth), so one paste syncs the whole profile. Never hand-edit it.

## When to run

- After `update-resume` changes `basics`, `work[]`, `education[]`, `skills[]`, `projects[]` or `languages[]`.
- Skip for styling, service-worker bumps, or `meta.lastModified`-only changes.

## Steps

1. Regenerate and check what changed:

   ```bash
   python3 .claude/skills/update-sharecv-pack/build.py
   git diff --stat sharecv-import.txt
   ```

   Empty diff: ShareCV is already current, stop.

2. Commit `sharecv-import.txt` with the resume change.

3. Sync ShareCV. With the Chrome extension connected and the user already signed in (never sign in for them), or by telling the user to do it:
   - `pbcopy < sharecv-import.txt`
   - https://sharecv.technolympus.com/dashboard → **Onboard with AI** → click the "Paste AI-generated output" box → Cmd+V → **Import, replace & save draft**.
   - Check **Template** still shows Modern Sidebar as Selected. If not, select it and press **Save**. (A template picked before an import is not persisted on its own.)
   - Preview at `/dashboard/preview`: 7+ roles, every project, skills, languages, social links.
   - **Publish** step: make sure Visibility is still Public (the profile lives at `/p/lemmuel-turaya`). Confirm logged-out with `curl -s https://sharecv.technolympus.com/p/lemmuel-turaya | grep -c "<new role or project name>"`.

## Payload notes

- Template key `modern-sidebar`; the field schema comes from ShareCV's prompt (Onboard with AI → View the prompt). If ShareCV changes its schema, re-read that prompt and update `build.py`.
- `SHOW_PUBLIC_EMAIL: true` because the email is already public on the portfolio. The "show phone" checkbox is not in the schema; it stays as set in the Basic Info UI.
- Skill levels are left empty: `resume.json` has none, and the prompt forbids inventing them.
