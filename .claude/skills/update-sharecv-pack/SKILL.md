---
name: update-sharecv-pack
description: Regenerate sharecv-pack.md, the copy-paste pack for the user's ShareCV profile (https://sharecv.technolympus.com/), from resume.json. Run whenever resume.json changes recruiter-visible content — new role, new project or case study, summary reframing, skills change. Chained from update-resume next to update-linkedin-pack.
---

# update-sharecv-pack

ShareCV is a CV builder with no import: the user logs in and types experience, skills and projects into its fields. `sharecv-pack.md` holds those fields, ready to paste. `resume.json` is the source of truth, so the pack is generated, never hand-edited.

## When to run

- After `update-resume` changes `basics`, `work[]`, `education[]`, `skills[]`, `projects[]` or `languages[]`.
- Skip for styling, service-worker bumps, or `meta.lastModified`-only changes.

## Steps

1. Regenerate:

   ```bash
   python3 .claude/skills/update-sharecv-pack/build.py
   git diff --stat sharecv-pack.md
   ```

2. If the diff is empty, stop: ShareCV is already current.
3. Otherwise commit `sharecv-pack.md` with the resume change, and tell the user which ShareCV sections changed (read the diff: Profile, Experience, Education, Skills, Projects, Languages) so they re-paste only those. Never log in to ShareCV for them.
