#!/usr/bin/env python3
"""Builds the static site into ../public from src/content.

Usage:  python3 src/build.py
Change the settings below (site name, domain, AdSense IDs), re-run, then upload public/.
No third-party packages needed (Python 3.8+).
"""
import html, json, os, re, shutil, datetime

# ======================= SETTINGS (edit these) =======================
SITE_NAME = "NameForge"                 # SITE_NAME placeholder: proposed name; change and rebuild
TAGLINE = "Free business name generator"
SITE_URL = "https://nameforge.live"        # final domain, no trailing slash (must be served from the domain root)
CONTACT_EMAIL = "hello@nameforge.live"     # CONTACT_EMAIL placeholder: set up this mailbox (or change it)
OPERATOR = "Donna Reilly Websites"      # who runs the site (shown on About/Privacy). Change if needed.
OPERATOR_LOCATION = "Ireland"           # add a postal address here if you have one you are happy to publish
ADSENSE_PUBLISHER_ID = "ca-pub-2314516397963402"  # "pub-..." or "ca-pub-..."; head script uses ca-pub-, ads.txt uses pub-
AD_SLOTS = {                            # AdSense "display ad unit" slot IDs, e.g. "1234567890". Empty = placeholder only
    "mid": "", "in-article": "", "sidebar": "", "footer": "",
}
UPDATED = datetime.date.today().isoformat()
# =====================================================================

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(ROOT), "public")
YEAR = datetime.date.today().year
esc = html.escape


def sub(text):
    return (text.replace("{{SITE_NAME}}", SITE_NAME).replace("{{SITE_URL}}", SITE_URL)
            .replace("{{CONTACT_EMAIL}}", CONTACT_EMAIL).replace("{{OPERATOR}}", OPERATOR)
            .replace("{{OPERATOR_LOCATION}}", OPERATOR_LOCATION).replace("{{UPDATED}}", UPDATED)
            .replace("{{YEAR}}", str(YEAR)))


def adsense_client():
    """Client id for the head script. Accepts pub-... or ca-pub-... so the ca- prefix is never doubled."""
    pid = ADSENSE_PUBLISHER_ID
    if not pid:
        return ""
    return pid if pid.startswith("ca-") else f"ca-{pid}"


def adsense_pub():
    """Publisher id for ads.txt (pub-..., never ca-pub-...)."""
    pid = ADSENSE_PUBLISHER_ID
    return pid[3:] if pid.startswith("ca-") else pid


def ad(slot, fmt="auto"):
    """One ad placement. Stays an empty, invisible div until a publisher ID + slot ID are set."""
    sid = AD_SLOTS.get(slot, "")
    if ADSENSE_PUBLISHER_ID and sid:
        return (f'<div class="ad-slot" data-slot="{slot}"><ins class="adsbygoogle" style="display:block" '
                f'data-ad-client="{adsense_client()}" data-ad-slot="{sid}" data-ad-format="{fmt}" data-full-width-responsive="true"></ins>'
                f'<script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script></div>')
    # NOTE: no whitespace inside the div so it collapses (CSS :empty) until real ad code is pasted in.
    return (f'<div class="ad-slot" data-slot="{slot}"><!-- AD SLOT "{slot}": paste an AdSense ad unit here, e.g. '
            f'<ins class="adsbygoogle" style="display:block" data-ad-client="ca-PUBLISHER_ID" data-ad-slot="SLOT_ID" '
            f'data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script> '
            f'(or set ADSENSE_PUBLISHER_ID + AD_SLOTS in src/build.py and rebuild) --></div>')


def adsense_head():
    client = adsense_client()
    if client:
        return (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={client}" '
                f'crossorigin="anonymous"></script>')
    return ('<!-- ADSENSE: when approved/applying, paste the AdSense code here: <script async '
            'src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-PUBLISHER_ID" crossorigin="anonymous"></script> '
            '(or set ADSENSE_PUBLISHER_ID in src/build.py and rebuild). Consent for EEA/UK visitors is handled by Google\'s own '
            'certified CMP: AdSense > Privacy & messaging. -->')


LOGO = ('<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#0f7a55"/>'
        '<path d="M18 44V20h6l12 15V20h6v24h-6L24 29v15z" fill="#fff"/><circle cx="49" cy="17" r="6" fill="#ff6b4a"/></svg>')

NAV = [("/", "Generator"), ("/guides/", "Guides"), ("/about/", "About"), ("/contact/", "Contact")]
FOOT_SITE = [("/", "Business name generator"), ("/guides/", "Naming guides"), ("/about/", "About"), ("/contact/", "Contact")]
FOOT_LEGAL = [("/privacy-policy/", "Privacy Policy"), ("/cookie-policy/", "Cookie Policy"), ("/terms/", "Terms of Use"), ("/disclaimer/", "Disclaimer")]


def page(path, title, desc, body, schema=None, og_type="website", current="/", sidebar=None):
    url = SITE_URL + path
    full_title = title if SITE_NAME in title else f"{title} | {SITE_NAME}"
    nav = "".join(f'<a href="{h}"{" aria-current=page" if h == current else ""}>{t}</a>' for h, t in NAV)
    fl = lambda items: "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in items)
    guides_links = "".join(f'<li><a href="/guides/{g["slug"]}/">{esc(g["short"])}</a></li>' for g in GUIDES[:5])
    schemas = "".join(f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>' for s in (schema or []))
    gsc = '<meta name="google-site-verification" content="9gQzu7OlF4xh4mfTBfUzIZbtSpeybEQYc6EdpcKnAG0" />\n' if path == "/" else ""
    main = body if not sidebar else f'<div class="wrap layout"><div>{body}</div><aside class="sidebar" aria-label="Advertising">{sidebar}</aside></div>'
    return f"""<!doctype html>
<html lang="en-IE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE_URL}/assets/og-image.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IE">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f7a55">
{gsc}<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/style.css">
<script>if(/[?&]ads=preview/.test(location.search))document.documentElement.className+=' ads-preview'</script>
{adsense_head()}
{schemas}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap">
<a class="logo" href="/" aria-label="{SITE_NAME} home">{LOGO}<span>{SITE_NAME}</span></a>
<nav class="nav" aria-label="Main">{nav}</nav>
</div></header>
<main id="main">
{main}
</main>
<div class="wrap">{ad("footer")}</div>
<footer class="site-footer"><div class="wrap">
<div class="cols">
<div><h2>{SITE_NAME}</h2><p>{TAGLINE} for small businesses in Ireland, the UK and beyond. Free, no sign-up.</p></div>
<div><h2>Popular guides</h2><ul>{guides_links}</ul></div>
<div><h2>Site</h2><ul>{fl(FOOT_SITE)}{fl(FOOT_LEGAL)}</ul></div>
</div>
<small>© {YEAR} {SITE_NAME}. Name ideas are suggestions only: always check availability and trademarks before you use a name. <a href="/disclaimer/">Disclaimer</a>.</small>
</div></footer>
</body>
</html>
"""


def read_content(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = sub(v.strip())
    return meta, sub(m.group(2))


def words(htmltext):
    return len(re.sub(r"<[^>]+>", " ", htmltext).split())


def write(path, text):
    full = os.path.join(OUT, path.strip("/"), "index.html") if not path.endswith(".html") else os.path.join(OUT, path.strip("/"))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(text)


# ---------- load guides ----------
GUIDES = []
for fn in sorted(os.listdir(os.path.join(ROOT, "content", "guides"))):
    meta, body = read_content(os.path.join(ROOT, "content", "guides", fn))
    meta["body"] = body
    meta["slug"] = fn.split("-", 1)[1].rsplit(".", 1)[0]
    GUIDES.append(meta)

ORG = {"@type": "Organization", "name": SITE_NAME, "url": SITE_URL + "/", "logo": SITE_URL + "/assets/apple-touch-icon.png"}


def crumbs_schema(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE_URL + u} for i, (n, u) in enumerate(items)]}


def build():
    if os.path.isdir(OUT):
        for item in os.listdir(OUT):
            p = os.path.join(OUT, item)
            if item in ("assets", "CNAME", "favicon.ico", "site.webmanifest"):
                continue
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    sitemap = []

    # ---------- home ----------
    meta, guide_html = read_content(os.path.join(ROOT, "content", "home-guide.html"))
    gp = re.split(r"(?=<h3)", guide_html)
    if len(gp) > 4:  # one in-content ad part-way through the on-page guide, away from the tool's buttons
        guide_html = "".join(gp[:4]) + ad("in-article", "fluid") + "".join(gp[4:])
    faq = json.load(open(os.path.join(ROOT, "content", "faq.json"), encoding="utf-8"))
    faq = [{"q": sub(f["q"]), "a": sub(f["a"])} for f in faq]
    industries = [("auto", "Auto-detect from keywords"), ("general", "Any / general"), ("plumbing", "Plumbing & heating"),
                  ("electrical", "Electrical"), ("bakery", "Bakery & cakes"), ("cafe", "Café & coffee"), ("beauty", "Beauty & salon"),
                  ("tech", "Tech & software"), ("cleaning", "Cleaning"), ("fitness", "Fitness & wellness"), ("photography", "Photography"),
                  ("crafts", "Crafts & handmade"), ("consulting", "Consulting & services"), ("pets", "Pets & grooming"),
                  ("gardening", "Gardening & landscaping")]
    styles = [("any", "Mix it up"), ("modern", "Modern"), ("playful", "Playful"), ("classic", "Classic"), ("short", "Short & brandable"), ("irish", "Irish / local")]
    opts = "".join(f'<option value="{k}">{v}</option>' for k, v in industries)
    chips = "".join(f'<input type="radio" name="style" id="s-{k}" value="{k}"{" checked" if k == "any" else ""}><label for="s-{k}">{v}</label>' for k, v in styles)
    faq_html = "".join(f'<details><summary>{esc(f["q"])}</summary><p>{f["a"]}</p></details>' for f in faq)
    guide_cards = "".join(f'<li><a href="/guides/{g["slug"]}/"><strong>{esc(g["title"])}</strong><span>{esc(g["description"])}</span></a></li>' for g in GUIDES)
    home_body = f"""
<section class="hero"><div class="wrap">
<h1>Free Business Name Generator</h1>
<p class="lead">Type a few words about your business and get 30+ fresh name ideas in seconds: brandable, local, playful or classic. Save your favourites and check the .com, .ie and social handles in one click.</p>
<form class="tool" id="gen-form" role="search" aria-label="Business name generator">
<div class="field"><label for="keywords">Keywords <span class="hint">(what you do, where, a word you love: separate with commas)</span></label>
<input type="text" id="keywords" name="k" placeholder="e.g. plumbing, Dublin" autocomplete="off" maxlength="120" spellcheck="false"></div>
<div class="row2">
<div class="field"><label for="industry">Industry</label><select id="industry" name="i">{opts}</select></div>
<fieldset><legend class="legend">Style</legend><div class="chips">{chips}</div></fieldset>
</div>
<button class="btn btn-primary" type="submit">Generate names</button>
</form>
<div id="results-wrap" hidden>
<div class="results-head"><h2 id="results-title" tabindex="-1">Your name ideas</h2><p class="meta" id="status" role="status" aria-live="polite"></p></div>
<ul class="grid" id="results" aria-labelledby="results-title"></ul>
<p class="more"><button class="btn btn-ghost" id="more" type="button">Load 30 more ideas</button></p>
</div>
<section class="favs" id="favs" hidden aria-labelledby="fav-title">
<h2 id="fav-title">♥ Your shortlist (<span id="fav-count">0</span>)</h2>
<p class="hint">Saved in this browser only. Nothing is sent to us.</p>
<ul id="fav-list"></ul>
<div class="fav-actions"><button class="btn btn-ghost" type="button" id="fav-copy">Copy all</button><button class="ibtn" type="button" id="fav-clear">Clear list</button></div>
</section>
</div></section>
<div class="wrap">{ad("mid")}</div>
<article class="wrap narrow content" id="guide">
{guide_html}
<section class="faq" aria-labelledby="faq-title"><h2 id="faq-title">Frequently asked questions</h2>{faq_html}</section>
<h2>Naming guides</h2>
<ul class="cards3">{guide_cards}</ul>
</article>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script src="/assets/generator.js" defer></script>
<script src="/assets/app.js" defer></script>
"""
    home_schema = [
        {"@context": "https://schema.org", "@type": "WebApplication", "name": f"{SITE_NAME} Business Name Generator",
         "url": SITE_URL + "/", "applicationCategory": "BusinessApplication", "operatingSystem": "Any (runs in your browser)",
         "browserRequirements": "Requires JavaScript", "isAccessibleForFree": True, "inLanguage": "en-IE",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
         "description": meta["description"], "publisher": ORG},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", f["a"])}} for f in faq]},
        {"@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": SITE_URL + "/"},
    ]
    write("/", page("/", meta["title"], meta["description"], home_body, home_schema))
    sitemap.append(("/", "1.0"))
    print(f"home guide: {words(guide_html)} words (+ FAQ {words(faq_html)})")

    # ---------- guides ----------
    cards = "".join(f'<li><a href="/guides/{g["slug"]}/"><strong>{esc(g["title"])}</strong><span>{esc(g["description"])}</span></a></li>' for g in GUIDES)
    body = f"""<div class="wrap content"><p class="crumbs"><a href="/">Home</a> › Guides</p>
<h1>Business naming guides</h1>
<p>Practical, no-fluff guides to naming a small business in Ireland, the UK and further afield: from brainstorming to checking trademarks and buying the domain.</p>
<ul class="cards3">{cards}</ul>
<div class="cta"><p><strong>Ready to brainstorm?</strong> Try the free generator: 30+ ideas per click.</p><a class="btn btn-primary" href="/">Open the name generator</a></div></div>"""
    write("/guides/", page("/guides/", "Business Naming Guides", "Free guides to naming a small business: choosing a name, checking trademarks in Ireland and the UK, picking a domain and avoiding common mistakes.", body,
                         [crumbs_schema([("Home", "/"), ("Guides", "/guides/")])], current="/guides/"))
    sitemap.append(("/guides/", "0.8"))
    for g in GUIDES:
        path = f"/guides/{g['slug']}/"
        body_html = g["body"]
        # put an in-article ad after roughly the 4th paragraph-level block
        parts = re.split(r"(?=<h2)", body_html)
        if len(parts) > 3:
            body_html = "".join(parts[:3]) + ad("in-article", "fluid") + "".join(parts[3:])
        related = [x for x in GUIDES if x is not g][:3]
        rel = "".join(f'<li><a href="/guides/{x["slug"]}/"><strong>{esc(x["title"])}</strong><span>{esc(x["description"])}</span></a></li>' for x in related)
        art = f"""<article class="content"><p class="crumbs"><a href="/">Home</a> › <a href="/guides/">Guides</a> › {esc(g['short'])}</p>
<h1>{esc(g['title'])}</h1>
<p class="byline">By the {SITE_NAME} team · Updated {UPDATED} · {max(1, round(words(g['body']) / 220))} min read</p>
{body_html}
<div class="cta"><p><strong>Need ideas now?</strong> Our free business name generator gives you 30+ names per click, with one-tap domain and social checks.</p><a class="btn btn-primary" href="/">Generate business names</a></div>
<h2>Keep reading</h2><ul class="cards3">{rel}</ul></article>"""
        schema = [{"@context": "https://schema.org", "@type": "Article", "headline": g["title"], "description": g["description"],
                   "datePublished": g.get("date", UPDATED), "dateModified": UPDATED, "author": {"@type": "Organization", "name": SITE_NAME},
                   "publisher": ORG, "mainEntityOfPage": SITE_URL + path, "image": SITE_URL + "/assets/og-image.png", "inLanguage": "en-IE"},
                  crumbs_schema([("Home", "/"), ("Guides", "/guides/"), (g["short"], path)])]
        write(path, page(path, g["title"], g["description"], art, schema, "article", "/guides/", sidebar=ad("sidebar")))
        sitemap.append((path, "0.7"))
        print(f"guide {g['slug']}: {words(g['body'])} words")

    # ---------- static pages ----------
    for fn in sorted(os.listdir(os.path.join(ROOT, "content", "pages"))):
        meta, body = read_content(os.path.join(ROOT, "content", "pages", fn))
        slug = fn.rsplit(".", 1)[0]
        path = f"/{slug}/"
        content = f'<div class="wrap narrow content"><p class="crumbs"><a href="/">Home</a> › {esc(meta["short"])}</p><h1>{esc(meta["title"])}</h1>{body}</div>'
        write(path, page(path, meta["title"], meta["description"], content, [crumbs_schema([("Home", "/"), (meta["short"], path)])], current=path))
        sitemap.append((path, "0.3" if slug not in ("about", "contact") else "0.5"))
        print(f"page {slug}: {words(body)} words")

    # ---------- 404 ----------
    nf = '<div class="wrap narrow content"><h1>Page not found</h1><p>Sorry, that page does not exist. Try the <a href="/">business name generator</a> or browse our <a href="/guides/">naming guides</a>.</p></div>'
    open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(page("/404.html", "Page not found", "Page not found.", nf).replace('<meta name="robots" content="index,follow,max-image-preview:large">', '<meta name="robots" content="noindex">'))

    # ---------- sitemap, robots, ads.txt ----------
    sm = "".join(f"<url><loc>{SITE_URL}{p}</loc><lastmod>{UPDATED}</lastmod><priority>{pr}</priority></url>\n" for p, pr in sitemap)
    open(os.path.join(OUT, "sitemap.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sm}</urlset>\n')
    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    pid = adsense_pub() or "pub-PUBLISHER_ID"
    adstxt = f"google.com, {pid}, DIRECT, f08c47fec0942fa0\n"
    if not ADSENSE_PUBLISHER_ID:
        adstxt = ("# ads.txt TEMPLATE: replace pub-PUBLISHER_ID with your AdSense publisher ID (AdSense > Account > Settings > Account information),\n"
                  "# e.g. google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0  (or set ADSENSE_PUBLISHER_ID in src/build.py and rebuild)\n") + adstxt
    open(os.path.join(OUT, "ads.txt"), "w").write(adstxt)
    # site name inside JS/CSS/manifest comments
    for f in ("assets/style.css", "site.webmanifest"):
        p = os.path.join(OUT, f)
        if os.path.exists(p):
            t = open(p, encoding="utf-8").read()
            t = re.sub(r'"name": "[^"]*"', f'"name": "{SITE_NAME} Business Name Generator"', t)
            t = re.sub(r'"short_name": "[^"]*"', f'"short_name": "{SITE_NAME}"', t)
            open(p, "w", encoding="utf-8").write(t)
    shutil.copy(os.path.join(ROOT, "htaccess.txt"), os.path.join(OUT, ".htaccess"))
    open(os.path.join(OUT, "_headers"), "w").write("# Netlify / Cloudflare Pages headers\n/assets/*\n  Cache-Control: public, max-age=604800\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n")
    print(f"built {len(sitemap)} pages into {OUT}")


if __name__ == "__main__":
    build()
