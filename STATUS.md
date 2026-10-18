# Avantix Labs: status

Read this first in any new chat. It is the single place that says where things stand, for Harsh, Parth and Claude.
Update it at the end of every working session (newest changes in the log at the bottom), and pull before editing so we don't overwrite each other. This repo is public, so never put passwords or keys here.

_Last updated: 2026-10-19_

## What we are building

**Avantix Labs** is a web, automation and AI agency run by **Parth Savaliya and Harsh Walia** (always list Parth first). Based in Birmingham, UK, serving UK small businesses (care and clinics first) and Indian manufacturers/exporters (second). Services: web development, 3D web, business automation, AI agents, booking systems, custom software, hosting & maintenance, B2B/export sites. Business plan: `Web_Automation_AI_Agency_Business_Plan.pdf` (Harsh's local folder, not in this repo).

Our own website has to be the most premium, 3D site we can make, because it doubles as Instagram/YouTube showcase content for selling the same work to clients.

## Where things are now

| Thing | State |
|---|---|
| Website | Live at **http://avantixlabs.in** (https certificate being issued by GitHub, then https-only gets switched on) |
| Code | This repo, **oliviaharsh/avantix-labs** (public). Every push to `main` redeploys in about a minute |
| Team access | Parth (GitHub `parthmsavaliya11-blip`) has write access to the repo |
| Domain | avantixlabs.in, bought at Hostinger. DNS at Hostinger: 4 A records (`@` → 185.199.108–111.153) + CNAME `www` → oliviaharsh.github.io |
| Hosting | GitHub Pages, free. The site is static, so it needs no Hostinger web app |
| Enquiry form | Live. Posts to a Google Apps Script → row in Google Sheet **"Avantix Labs enquiries"** (Harsh's Google account, shared with Parth) + email to harshwalia8888@gmail.com and parthmsavaliya0315@gmail.com, reply-to the visitor. Script source: `scripts/enquiry-apps-script.gs` |
| Brand | Final: **Sculpted Ivory** theme (ivory, limestone, espresso, bronze; Instrument Serif + Manrope) and the **Keystone** logo kit (`src/assets/logo/`). Not to be reopened |
| Private preview | Claude artifact https://claude.ai/artifact/XPw44EBAHMkKH3ebWks8Tb (single-file copy, private) |
| Website Playbook (SOP) | https://claude.ai/artifact/QNAtPQ9i8u2A5qW2mpomER (private; share from its Share menu). Source: Harsh's `Website Dev/playbook/website-playbook.html`. The 13-step process, build levels L1–L5, backend/hosting/domain/maps/SEO-GEO guides, 13 website types with what each needs and doesn't |
| Promo videos | `media/` (Harsh's computer only, not in the repo) (16:9 + 9:16 Reel). **Out of date**: they still show "Book a free 20-minute call" and the Founders link; re-record before posting |

### The site, in brief
- Neural-brain intro → 3D Avantix sculpture hero → 8 service chapters, each with a live demo → process → enquiry form.
- All words live in `src/content/content.js`. Switches there: `showPrices` (off), `showFounders` (off), `formEndpoint`, `bookingUrl` (empty), `url`.
- Demos are fictional businesses: physio clinic (web), bookshelf speaker (3D), clinic agent, care agency rota, Jaipur textile exporter (export). **No flange content anywhere.**
- Performance rules (after fixing lag on 2026-10-07): keep 3D within them (see `README.md` → Performance). Hero ~60 fps on Harsh's Intel Iris Xe laptop.

### Hosting decisions
- **Hostinger** (Business plan): domain, DNS, email, and Node web apps. Web-app slots are full (5/5, e.g. amibot.harshwalia.in).
- Not upgrading to Hostinger Cloud Startup (₹8,177/yr for only 10 apps).
- For more server apps later: **Railway** (Hobby $5/mo, 50 apps, usage-billed) or a **VPS with Coolify** (fixed price, unlimited apps). To decide when needed.

## What's next

1. **https (stuck since 12 Oct)**: GitHub still hasn't issued the certificate; next step is to remove and re-add the custom domain in Pages settings (needs Harsh's OK). Once `gh api repos/oliviaharsh/avantix-labs/pages` shows a certificate, switch on "Enforce HTTPS" and test the form on the live domain.
2. Delete the two test rows in the enquiries Sheet.
3. Booking link: create a Cal.com/Calendly and set `bookingUrl` so every "Book a call" button opens it.
4. Privacy and cookie pages (the form collects personal data).
5. Business email such as hello@avantixlabs.in on Hostinger (optional; enquiries currently go to Gmail).
6. When ready: confirm founder bios and prices, then switch `showFounders` / `showPrices` back on.
7. Re-record the promo videos from the new site.
8. More server apps: choose Railway or a VPS, then move apps off Hostinger's full web-app slots.

## Log
- **2026-10-06/07**: Brand themes → Sculpted Ivory chosen; Keystone logo kit; full 3D site built and deployed to GitHub Pages; promo videos recorded.
- **2026-10-07**: Prices and founders hidden, call length removed, flange demos replaced (speaker, textiles). Lag fixed (hero 22→60 fps, no load/scroll freezes). Fixed the Process link landing on the wrong section.
- **2026-10-11**: Parth added to the GitHub repo.
- **2026-10-12**: Status file moved into the repo so Parth can read and update it too.
- **2026-10-12**: Moved to avantixlabs.in (DNS set at Hostinger, live over http; certificate pending). Enquiry form connected to Google Sheets + email for Harsh and Parth. Hosting options compared (Hostinger web apps vs Railway vs VPS). This status file created.
- **2026-10-19**: Website Playbook (SOP + website-type catalogue) published as a private artifact. https certificate still not issued.
