"""Generate sharecv-import.txt (ShareCV "Onboard with AI" payload) from resume.json.

Run from the repo root:  python3 .claude/skills/update-sharecv-pack/build.py
Deterministic: same resume.json in, same file out.
"""
import json
from html import escape

r = json.load(open('resume.json'))
b = r['basics']
loc = b.get('location', {})


def html(summary, bullets=(), tech=()):
    s = f'<p>{escape(summary)}</p>' if summary else ''
    if bullets:
        s += '<ul>' + ''.join(f'<li>{escape(x)}</li>' for x in bullets) + '</ul>'
    if tech:
        s += f"<p><strong>Tech:</strong> {escape(', '.join(tech))}</p>"
    return s


def day(d):
    return d or ''


t = [
    'BEGIN_SHARECV_TEMPLATE_DATA',
    'TEMPLATE_KEY: modern-sidebar',
    f"FULL_NAME: {b['name']}",
    f"HEADLINE: {b['label']}",
    f"ABOUT: {html(b['summary'])}",
    f"LOCATION: {loc.get('city')}, {loc.get('region')}, Philippines",
    f"WEBSITE: {b['url']}",
    f"PHONE: {b['phone']}",
    f"EMAIL: {b['email']}",
    'SHOW_PUBLIC_EMAIL: true',  # published on the portfolio and in resume.json
    f"PROFILE_IMAGE_URL: {b['image']}",
    'PRIMARY_CATEGORY: Programmer',
    'JOB_CATEGORIES: Programmer',
    '',
    'SOCIAL_LINKS:',
]
for p in b.get('profiles', []):
    if p['network'] != 'Portfolio':  # already WEBSITE
        t += [f"- TYPE: {p['network']}", f"  URL: {p['url']}"]
t += ['', 'EXPERIENCE:']
for w in r['work']:
    t += [f"- JOB_TITLE: {w['position']}", f"  COMPANY: {w['name']}", f"  LOCATION: {w.get('location', '')}",
          '  EMPLOYMENT_TYPE: ', f"  START_DATE: {day(w.get('startDate'))}", f"  END_DATE: {day(w.get('endDate'))}",
          f"  IS_CURRENT: {'false' if w.get('endDate') else 'true'}",
          f"  DESCRIPTION: {html(w.get('summary'), w.get('highlights', []), w.get('keywords', []))}"]
t += ['', 'EDUCATION:']
for e in r.get('education', []):
    t += [f"- INSTITUTION: {e['institution']}", f"  DEGREE: {e['studyType']}", f"  FIELD_OF_STUDY: {e['area']}",
          f"  START_DATE: {day(e.get('startDate'))}", f"  END_DATE: {day(e.get('endDate'))}", f"  CREDENTIAL_URL: {e.get('url', '')}",
          f"  DESCRIPTION: {html(e.get('score', ''), (), e.get('courses', [])).replace('Tech:', 'Courses:')}"]
t += ['', 'PROJECTS:']
for p in r['projects']:
    t += [f"- TITLE: {p['name']}", f"  DESCRIPTION: {html(p.get('description', ''), p.get('highlights', []), p.get('keywords', []))}",
          f"  URL: {p.get('url', '')}", '  LINKS: ', f"  START_DATE: {day(p.get('startDate'))}", '  END_DATE: ',
          f"  CATEGORY: {p.get('type', '').capitalize()}"]
t += ['', 'SKILLS:']
for s in r['skills']:
    for k in s['keywords']:
        t += [f'- NAME: {k}', '  LEVEL: ', f"  CATEGORY: {s['name']}"]
t += ['', 'CERTIFICATIONS:', '', 'LANGUAGES:']
for l in r.get('languages', []):
    t += [f"- NAME: {l['language']}", f"  PROFICIENCY: {l.get('fluency', '')}"]
t += ['', 'END_SHARECV_TEMPLATE_DATA']
open('sharecv-import.txt', 'w').write('\n'.join(t) + '\n')
print('wrote sharecv-import.txt')
