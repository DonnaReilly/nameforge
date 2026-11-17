# NameForge: free business name generator (AdSense-ready static site)

## Deployable site and GitHub Pages

`public/` is the deployable site. It is the finished static website (HTML, CSS and JavaScript) and can be published as-is. `src/` is the source you edit before rebuilding; hosts should serve `public/`, not `src/`.

GitHub Pages is wired up in `.github/workflows/pages.yml`. A push to `main` (or a manual run from the Actions tab) uploads `public/` with `actions/upload-pages-artifact` and publishes that artifact with `actions/deploy-pages`.

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`, or run **Deploy GitHub Pages** from the **Actions** tab.
4. When the run succeeds, the site URL is on the workflow summary and under **Settings → Pages**. The custom domain is `https://nameforge.live` (`public/CNAME`).

The built pages use root-absolute links (`/assets/...`, `/guides/...`) and are meant to be served from the domain root (`SITE_URL` in `src/build.py`, currently `https://nameforge.live`). `public/CNAME` tells GitHub Pages to serve the site at that domain, from the root, so those links resolve. Without the custom domain, the project URL `https://donnareilly.github.io/nameforge/` would 404 them. Rebuild with `python3 src/build.py` after changing the domain or contact email in `src/build.py`.

A fast, static (plain HTML/CSS/JS) business name generator with 8 original naming guides and all the
pages Google AdSense reviewers look for. There's no backend, no database and no paid APIs, so it runs on
Namecheap shared hosting, Netlify, Cloudflare Pages or anything else that serves files.

`SITE_NAME` is a placeholder. The proposed name is **NameForge**. To rename it, edit the settings at the
top of `src/build.py` and rebuild.

## Folder layout

```
public/            <- UPLOAD THE CONTENTS OF THIS FOLDER (the live website)
  index.html       generator + on-page guide + FAQ (schema.org WebApplication + FAQPage)
  guides/          8 guides (/guides/<slug>/)
  about/ contact/ privacy-policy/ cookie-policy/ terms/ disclaimer/
  404.html  sitemap.xml  robots.txt  ads.txt  favicon.ico  site.webmanifest  .htaccess  _headers
  assets/          style.css, generator.js (name engine), app.js (UI), icons, og-image.png
src/               <- source: edit here, then run the build
  build.py         settings (site name, domain, email, AdSense IDs) + page templates
  content/         home-guide.html, faq.json, guides/*.html, pages/*.html
  htaccess.txt     Apache config copied to public/.htaccess
  og-image.html    source for the social share image (re-screenshot at 1200x630 if you rename)
screenshots/       desktop & mobile screenshots
sample-output.md   example generator output
```

## Rename / configure

1. Open `src/build.py` and edit `SITE_NAME`, `SITE_URL` (final domain, served from the domain root),
   `CONTACT_EMAIL`, `OPERATOR` and `OPERATOR_LOCATION`.
2. Run `python3 src/build.py`. It needs Python 3.8+ and no packages. This regenerates every page, the
   sitemap, robots.txt and ads.txt.
3. If you rename, also update `public/site.webmanifest`, the logo text in `src/og-image.html` (then
   re-screenshot it to `public/assets/og-image.png`) and the `.htaccess` if needed.

## Deploy

**Namecheap shared hosting (cPanel)**
1. Get SSL working first: cPanel > *SSL/TLS Status* > run AutoSSL. Namecheap includes a free certificate
   on shared hosting. Then uncomment the HTTPS redirect in `public/.htaccess`.
2. In File Manager, upload the **contents** of `public/` into `public_html/` (or the addon domain's folder).
   Make sure hidden files are shown so `.htaccess` goes up too.
3. Visit `https://yourdomain/`, `/ads.txt`, `/sitemap.xml` and a guide page to check everything loads.

**Netlify / Cloudflare Pages:** drag-and-drop the `public/` folder (or connect a Git repo with the
publish directory `public`). Both pick up `404.html` and `_headers` automatically.

## Google AdSense

### Before you apply (what to aim for)
- **Content:** the site ships with roughly 8,000 words of original guides plus about 1,400 words on the
  homepage. Before applying, add **at least 4 to 7 more guides** (15+ substantial pages in total is a
  comfortable target), personalise the About page, and keep publishing 1 to 2 guides a month. AdSense
  rejects thin, templated or mass-generated content ("low value content"). Edit the guides so they
  sound like you and add your own examples.
- **Traffic:** AdSense sets no official minimum. In practice, sites get approved more easily once they're
  indexed and getting some organic visits (for example, a few dozen a day from Google over 2 to 4
  weeks). Earnings matter more: tool sites usually need **thousands of visits a day** to make meaningful
  money (as a rough guide, €2 to €10 per 1,000 pageviews for Ireland/UK traffic, depending on niche and
  season).
- **Basics:** HTTPS working, all pages reachable from the menu/footer, a working contact email,
  Privacy Policy that mentions AdSense (done), and the site live for a few weeks.

### Steps
1. Sign up at adsense.google.com, add the site, and copy your publisher ID (`pub-XXXXXXXXXXXXXXXX`).
2. Put it in `ADSENSE_PUBLISHER_ID` in `src/build.py` and rebuild. This adds the AdSense script to every
   page's `<head>` and fills in `ads.txt`. (Without the build: paste the script where the
   `<!-- ADSENSE: ... -->` comment is in each page's head, and edit `ads.txt` by hand.)
3. **ads.txt:** `public/ads.txt` should contain exactly
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`, at `https://yourdomain/ads.txt`.
4. **Consent (EEA/UK/Switzerland, required):** in AdSense go to **Privacy & messaging > European
   regulations** and create and publish a GDPR message with **Google's own certified CMP**. Include the
   "Do not consent" option, and keep the "Privacy and cookie settings" revocation link turned on (the
   Privacy and Cookie policies refer to it). Don't add a second cookie banner plugin, because it would
   conflict.
5. **Ad placements:** after approval, either turn on **Auto ads** (simplest), or create display ad units
   and put their slot IDs in `AD_SLOTS` in `src/build.py`, then rebuild. Each placement is an
   empty `<div class="ad-slot" data-slot="...">` with a comment showing the exact code to paste. Empty
   slots take up no space. Preview them by adding `?ads=preview` to any URL.
   - `mid`: below the generator/results, above the guide (home)
   - `in-article`: part-way through the home guide and each article
   - `sidebar`: sticky right column on article pages (desktop only)
   - `footer`: above the footer on every page

   Slots are deliberately kept away from the Generate, Copy, Save and Load more buttons, so no ad sits
   where people could click it by accident (an AdSense policy issue).
6. **Never click your own ads** or ask anyone else to.

## Google Search Console
1. Go to search.google.com/search-console, add a **Domain** property and verify it with the DNS TXT
   record (Namecheap: Domain List > Manage > Advanced DNS).
2. Submit `https://yourdomain/sitemap.xml` under *Sitemaps*.
3. Use *URL inspection* > *Request indexing* on the homepage and guides.
4. Optional: also add the site to Bing Webmaster Tools (it can import from Search Console).

## How the generator works (assets/generator.js)
It runs entirely client-side and makes about 30 names per click, then "Load more" adds 30 new ones
with no repeats. It mixes 10 techniques: compounds (Pipeworks), prefixes (Novaflow), descriptive
(Dublin Tap Plumbers), overlap blends (Kawaiink), alliteration (Warm Water Works), curated rhymes
(Flow & Glow), invented brandables (Kavora), suffixes (Flowly), Irish/local names (Corrib Roast Co.,
"Solas = light") and phrase templates (Oh My Dough). It uses word banks for 14 industries, local
nicknames for Irish and UK places, and auto-detects the industry from keywords. Quality filters handle
pronounceability, length, profanity and disease words, and stop any one word from dominating a batch.

Other features: copy button, ♡ favourites saved in `localStorage`, shareable URLs
(`?k=plumbing,dublin&i=plumbing&s=modern`), and per-name check links for .com (Namecheap), .ie and .co.uk
(Instant Domain Search), Instagram, TikTok, Facebook and X.

Tip: the .com link goes to Namecheap. If you join Namecheap's affiliate programme, you could swap in
your affiliate link in `checkLinks()` in `assets/app.js` for extra income. Disclose it on the
Disclaimer page if you do.

## Test results (local)
- All 17 pages load with no JS errors or 404s (headless Chrome + Playwright).
- Generator, load more, favourites (kept after reload), copy and check links all tested.
- Lighthouse (mobile and desktop): Performance 100, Accessibility 100, Best Practices 100, SEO 100.
  Compression and caching are handled by `.htaccess` / `_headers` on the live host.
