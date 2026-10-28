"""Generate sharecv-pack.md (ShareCV copy-paste pack) from resume.json.

Run from the repo root:  python3 .claude/skills/update-sharecv-pack/build.py
Deterministic: same resume.json in, same file out, so a diff shows exactly
which ShareCV fields need re-pasting.
"""
import json
from datetime import date

r = json.load(open('resume.json'))
b = r['basics']


def month(d):
    return date.fromisoformat(d).strftime('%b %Y') if d else 'Present'


def span(x):
    return f"{month(x.get('startDate'))} – {month(x.get('endDate'))}"


loc = b.get('location', {})
out = [
    '# ShareCV pack',
    '',
    f"Generated from `resume.json` (lastModified {r['meta']['lastModified']}) by `.claude/skills/update-sharecv-pack/build.py`.",
    'Paste each block into the matching ShareCV field at https://sharecv.technolympus.com/. Do not edit by hand; edit resume.json and re-run.',
    '',
    '## Profile',
    '',
    f"- **Name:** {b['name']}",
    f"- **Headline:** {b['label']}",
    f"- **Location:** {loc.get('city')}, {loc.get('region')}, Philippines",
    f"- **Email:** {b['email']}",
    f"- **Phone:** {b['phone']}",
    f"- **Website:** {b['url']}",
    f"- **Photo:** {b['image']}",
    '',
    '**Links**',
    '',
    *[f"- {p['network']}: {p['url']}" for p in b.get('profiles', [])],
    '',
    '**Summary**',
    '',
    b['summary'],
    '',
    '## Experience',
]
for w in r['work']:
    out += ['', f"### {w['position']} — {w['name']}", '', f"{span(w)} · {w.get('location', '')}", '']
    if w.get('summary'):
        out += [w['summary'], '']
    out += [f'- {h}' for h in w.get('highlights', [])]
    if w.get('keywords'):
        out += ['', 'Tech: ' + ', '.join(w['keywords'])]

out += ['', '## Education']
for e in r.get('education', []):
    out += ['', f"### {e['studyType']} in {e['area']} — {e['institution']}", '', f"{span(e)}" + (f" · {e['score']}" if e.get('score') else '')]
    if e.get('courses'):
        out += ['', 'Courses: ' + ', '.join(e['courses'])]

out += ['', '## Skills', '']
out += [f"- **{s['name']}:** {', '.join(s['keywords'])}" for s in r['skills']]

out += ['', '## Projects']
for p in r['projects']:
    out += ['', f"### {p['name']}", '']
    if p.get('url'):
        out += [p['url'], '']
    out += [p.get('description', '')]
    if p.get('keywords'):
        out += ['', 'Tech: ' + ', '.join(p['keywords'])]

if r.get('languages'):
    out += ['', '## Languages', '']
    out += [f"- {l['language']}: {l.get('fluency', '')}" for l in r['languages']]

open('sharecv-pack.md', 'w').write('\n'.join(out).rstrip() + '\n')
print('wrote sharecv-pack.md')
