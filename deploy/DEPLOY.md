# Deploying the portfolio to Linode (Akamai Cloud)

This deploys the **static site** + a tiny **Node backend** that replaces Netlify
Forms (contact form capture) and the old Netlify Function (`/api/messages` admin
viewer). The chat widget is pure client-side and needs nothing.

**The contact-form HTML is unchanged** — it still posts Netlify-style to the page
it lives on. On Netlify, Netlify Forms captures it. On this server, nginx routes
that POST to the Node backend instead. Same repo, both deployments work, no
divergence — so `kon2raya.netlify.app` keeps working exactly as before.

**Architecture on the server**

```
   visitor ──HTTPS──> nginx ──(GET: static files)──> /var/www/portfolio/*.html, css, js
                        │
                        └──(POST / , /classic.html , GET /api/*)──> Node (127.0.0.1:3000)
                                          └── writes/reads /var/www/portfolio/server/data/messages.jsonl
```

- `GET` anything → nginx serves static files.
- `POST /` or `POST /classic.html` (the contact forms) → nginx routes to Node,
  which stores the submission and 303-redirects back to `?sent=1`.
- `GET /api/messages` → Node returns JSON (HTTP Basic Auth) for `admin/messages.html`.

---

## 0. Before you touch the server — push the new code

The backend + deploy config live in this repo. Commit and push them first, then
the server just `git clone`s. **The contact-form HTML is *not* changed**, so this
push is safe for the live Netlify site.

From `c:\xampp\htdocs\portfolio` on your PC:

```powershell
git add server deploy netlify.toml admin/messages.html
git commit -m "Add self-hosted contact backend + deploy config (works alongside Netlify)"
git push origin main
```

> Only `server/`, `deploy/`, a couple of `netlify.toml` redirects, and one line of
> admin text change. The forms are untouched.
> The repo's `.gitignore` keeps `server/data/` (captured messages) out of git.

---

## 1. Create the Linode

In the Cloud Manager (https://cloud.linode.com/linodes → **Create Linode**):

| Setting        | Choose                                                            |
|----------------|------------------------------------------------------------------|
| Distribution   | **Ubuntu 24.04 LTS**                                             |
| Region         | **Singapore** (closest to PH = lowest latency)                  |
| Plan           | **Nanode 1 GB** (Shared CPU, ~$5/mo) — plenty for a portfolio   |
| Root password  | set a strong one                                                |
| SSH key        | add yours if you have one (recommended over password)          |

Create it, then copy the Linode's **public IPv4** from the Linode's page.

---

## 2. First login + secure the box

```bash
ssh root@YOUR_SERVER_IP

# update
apt update && apt upgrade -y

# create a non-root sudo user (replace 'deploy' with whatever you like)
adduser deploy
usermod -aG sudo deploy

# (if you use an SSH key) copy it to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# firewall: allow SSH + web only
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

Log back in as the new user for everything below:

```bash
ssh deploy@YOUR_SERVER_IP
```

---

## 3. Install nginx + Node.js

```bash
sudo apt install -y nginx git

# Node.js 20 LTS from NodeSource (installs node to /usr/bin/node)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version    # expect v20.x
which node        # expect /usr/bin/node  (must match the systemd unit)
```

---

## 4. Get the code onto the server

```bash
sudo git clone https://github.com/kon2raya24/portfolio.git /var/www/portfolio
sudo chown -R www-data:www-data /var/www/portfolio
```

> Updating later is just `sudo git -C /var/www/portfolio pull` (see §9).

---

## 5. Configure + start the backend service

```bash
# 5a. the secret env file (holds ADMIN_PASSWORD)
sudo cp /var/www/portfolio/deploy/portfolio-api.env.example /etc/portfolio-api.env
sudo nano /etc/portfolio-api.env          # set ADMIN_PASSWORD to a strong value
                                          # tip: openssl rand -base64 24
sudo chmod 600 /etc/portfolio-api.env

# 5b. make sure the data dir exists and is writable by the service
sudo mkdir -p /var/www/portfolio/server/data
sudo chown -R www-data:www-data /var/www/portfolio/server

# 5c. install + start the systemd service
sudo cp /var/www/portfolio/deploy/portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
sudo systemctl status portfolio-api       # should be "active (running)"

# 5d. quick local check (before nginx)
curl -s http://127.0.0.1:3000/api/health  # -> {"ok":true}
```

If `status` shows a failure, read the logs: `journalctl -u portfolio-api -e`.
Most common cause: `which node` is not `/usr/bin/node` — fix `ExecStart` in the
unit file if so.

---

## 6. Configure nginx

```bash
# the shared snippets (security headers + backend proxy settings)
sudo cp /var/www/portfolio/deploy/security-headers.conf /etc/nginx/snippets/
sudo cp /var/www/portfolio/deploy/proxy-backend.conf /etc/nginx/snippets/

# the site config
sudo cp /var/www/portfolio/deploy/nginx-portfolio.conf /etc/nginx/sites-available/portfolio

# set your real domain in the config (replace both YOUR_DOMAIN occurrences)
sudo nano /etc/nginx/sites-available/portfolio

# enable it, drop the default site
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t                  # config test — must say "syntax is ok"
sudo systemctl reload nginx
```

Now `http://YOUR_SERVER_IP/` should already show the site (the
`server_name` won't match the bare IP, but with the default site removed this is
the only server block, so it answers).

---

## 7. Point your domain at the server (DNS)

At your domain registrar (or Linode's DNS Manager), create:

| Type | Host  | Value             |
|------|-------|-------------------|
| A    | `@`   | `YOUR_SERVER_IP`  |
| A    | `www` | `YOUR_SERVER_IP`  |

DNS can take a few minutes to a couple of hours. Check with:

```bash
dig +short YOUR_DOMAIN        # should return YOUR_SERVER_IP
```

Don't do §8 until this resolves — certbot validates over the real domain.

---

## 8. Enable HTTPS (free, auto-renewing)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
# choose "redirect HTTP to HTTPS" when prompted
```

certbot edits your nginx config to add the TLS server block + the 80→443
redirect, and installs a renewal timer. Confirm renewal works:

```bash
sudo certbot renew --dry-run
```

---

## 9. Verify the whole flow

1. Open `https://YOUR_DOMAIN/` — site loads over HTTPS.
2. Scroll to **send a message**, submit the form → you land on `…/?sent=1` and
   see the **TRANSMISSION SENT** success state.
3. Open `https://YOUR_DOMAIN/admin/messages.html` — the browser prompts for a
   username/password. Username can be anything; password = your `ADMIN_PASSWORD`.
   Your test message should appear in the table.
4. Try the night-shift game's comms screen too — it posts to the same endpoint.

From the shell you can also check directly:

```bash
curl -s -u "admin:YOUR_ADMIN_PASSWORD" https://YOUR_DOMAIN/api/messages
```

---

## 10. Updating the site later

```bash
sudo git -C /var/www/portfolio pull
sudo chown -R www-data:www-data /var/www/portfolio
sudo systemctl restart portfolio-api    # only needed if server/ changed
```

Static-only changes (HTML/CSS/JS) need no restart — nginx serves them live.

---

## 11. Backing up messages

Submissions are a plain text file. Back it up however you like:

```bash
sudo cp /var/www/portfolio/server/data/messages.jsonl ~/messages-backup-$(date +%F).jsonl
```

---

## Optional: test the backend on your PC first

You already verified this works locally. To repeat:

```powershell
cd c:\xampp\htdocs\portfolio\server
$env:ADMIN_PASSWORD = "testpass123"
node server.js
# in another terminal:
#   curl http://127.0.0.1:3000/api/health
#   curl -u admin:testpass123 http://127.0.0.1:3000/api/messages
```

Note: your local XAMPP/Apache won't proxy `/api/` to Node, so the *form on the
static site* only works end-to-end once nginx is in front of it (i.e. on the
Linode). The backend itself is fully testable on its own as above.

---

## What changed vs. the Netlify version

| Concern              | Netlify (before)                 | Linode (now)                              |
|----------------------|----------------------------------|-------------------------------------------|
| Static hosting       | Netlify CDN                      | nginx on your VPS                         |
| Contact form capture | Netlify Forms (`data-netlify`)   | `POST /api/contact` → `messages.jsonl`    |
| Admin messages       | Netlify Function + Forms API     | `GET /api/messages` (Node, Basic Auth)    |
| Spam filtering       | Netlify honeypot + Akismet       | honeypot (`bot-field`) + per-IP rate limit|
| HTTPS                | automatic                        | certbot / Let's Encrypt (auto-renew)      |

The old `netlify.toml` and `netlify/functions/` are unused on Linode — harmless
to leave in the repo (handy if you ever want to redeploy to Netlify).
