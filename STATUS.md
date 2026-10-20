# Avantix Labs: status

Read this first in any new chat. It is the single place that says where things stand, for Harsh, Parth and Claude.
Update it at the end of every working session (newest changes in the log at the bottom), and pull before editing so we don't overwrite each other. This repo is public, so never put passwords or keys here.

_Last updated: 2026-10-21_

## What we are building

**Avantix Labs** is a web, automation and AI agency run by **Parth Savaliya and Harsh Walia** (always list Parth first). Based in Birmingham, UK, serving UK small businesses (care and clinics first) and Indian manufacturers/exporters (second). Services: web development, 3D web, business automation, AI agents, booking systems, custom software, hosting & maintenance, B2B/export sites. Business plan: `Web_Automation_AI_Agency_Business_Plan.pdf` (Harsh's local folder, not in this repo).

Our own website has to be the most premium, 3D site we can make, because it doubles as Instagram/YouTube showcase content for selling the same work to clients.

## Where things are now

| Thing | State |
|---|---|
| Website | Live at **https://avantixlabs.in** (HTTPS enforced; www, http and the old github.io link all redirect there. Certificate auto-renews, current one to 2027-01-18) |
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
- Demos are fictional businesses: six client sites in the web chapter (physio clinic, café, cocktail bar, hair salon, garage, financial planner; each an old "before" site and our redesign, switched by browser tabs and touring by itself), bookshelf speaker (3D), clinic agent, care agency rota, Jaipur textile exporter (export). Business names were checked against real firms; phone numbers use Ofcom's drama ranges. **No flange content anywhere.**
- Performance rules (after fixing lag on 2026-10-07): keep 3D within them (see `README.md` → Performance). Hero ~60 fps on Harsh's Intel Iris Xe laptop.

### Hosting decisions
- **Hostinger** (Business plan): domain, DNS, email, and Node web apps. Web-app slots are full (5/5, e.g. amibot.harshwalia.in).
- Not upgrading to Hostinger Cloud Startup (₹8,177/yr for only 10 apps).
- For more server apps later: **Railway** (Hobby $5/mo, 50 apps, usage-billed) or a **VPS with Coolify** (fixed price, unlimited apps). To decide when needed.

## What's next

1. **Google Search Console + Bing Webmaster Tools**: verify avantixlabs.in (DNS TXT record at Hostinger) and submit https://avantixlabs.in/sitemap.xml, so Google indexes the site. Needs Harsh's Google login.
2. Booking link: create a Cal.com/Calendly and set `bookingUrl` so every "Book a call" button opens it.
3. Privacy and cookie pages (the form collects personal data).
4. Business email such as hello@avantixlabs.in on Hostinger (optional; enquiries currently go to Gmail).
5. When ready: confirm founder bios and prices, then switch `showFounders` / `showPrices` back on.
6. Re-record the promo videos from the new site.
7. More server apps: choose Railway or a VPS, then move apps off Hostinger's full web-app slots.

## Log
- **2026-10-06/07**: Brand themes → Sculpted Ivory chosen; Keystone logo kit; full 3D site built and deployed to GitHub Pages; promo videos recorded.
- **2026-10-07**: Prices and founders hidden, call length removed, flange demos replaced (speaker, textiles). Lag fixed (hero 22→60 fps, no load/scroll freezes). Fixed the Process link landing on the wrong section.
- **2026-10-11**: Parth added to the GitHub repo.
- **2026-10-12**: Status file moved into the repo so Parth can read and update it too.
- **2026-10-12**: Moved to avantixlabs.in (DNS set at Hostinger, live over http; certificate pending). Enquiry form connected to Google Sheets + email for Harsh and Parth. Hosting options compared (Hostinger web apps vs Railway vs VPS). This status file created.
- **2026-10-19**: Website Playbook (SOP + website-type catalogue) published as a private artifact. https certificate still not issued.
- **2026-10-20**: https fixed: the certificate had stalled since 12 Oct; removing and re-adding the custom domain triggered it within a minute. HTTPS now enforced.
- **2026-10-20**: Test rows removed from the enquiries Sheet (now empty, headers kept).
- **2026-10-20**: Bug sweep of the live site (desktop, phone, reduced motion, no WebGL, deep links, all nav links, every demo, the form with sending blocked). Fixed: hero stretched after a window resize; a second H1 from the web-design demo; tilt warnings; form error pointing to a non-existent email. Added sitemap.xml, robots.txt with sitemap, branded 404 page, fuller manifest.
- **2026-10-21**: Web design demo grew from one site to six: Harbour Lane (physio), Ember & Oat (café, Kings Heath), The Copper Moth (cocktail bar, Jewellery Quarter), Juniper Row (hair salon, Harborne), Pryor & Daughters (garage, Acocks Green), Ashby Rowe (financial planner, Edgbaston). Each has its own photo, fonts and colours. Browser tabs switch sites; the demo tours them by itself until touched. Scroll still ~58 fps.
