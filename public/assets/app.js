/* UI for the generator. Requires generator.js (window.NameGen). */
(function () {
  'use strict';
  var form = document.getElementById('gen-form');
  if (!form || !window.NameGen) return;

  var $ = function (id) { return document.getElementById(id); };
  var list = $('results'), moreBtn = $('more'), status = $('status'), resultsWrap = $('results-wrap');
  var favList = $('fav-list'), favWrap = $('favs'), favCount = $('fav-count'), toast = $('toast');
  var KEY = 'namegen:favourites';
  var shown = {}, lastOpts = null, toastTimer;

  function loadFavs() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveFavs(f) { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) { /* private mode */ } }
  var favs = loadFavs();

  function say(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }
  function copy(text) {
    var done = function () { say('Copied “' + text + '”'); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done, fallback);
    fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { say('Press Ctrl+C to copy'); } document.body.removeChild(t);
    }
  }
  function isFav(slug) { return favs.some(function (f) { return f.slug === slug; }); }
  function toggleFav(name, slug) {
    if (isFav(slug)) favs = favs.filter(function (f) { return f.slug !== slug; });
    else favs.unshift({ name: name, slug: slug });
    saveFavs(favs); renderFavs(); syncFavButtons();
    say(isFav(slug) ? 'Saved to your list' : 'Removed from your list');
  }
  function syncFavButtons() {
    list.querySelectorAll('button[data-fav]').forEach(function (b) {
      var on = isFav(b.getAttribute('data-fav'));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '♥ Saved' : '♡ Save';
    });
  }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function checkLinks(slug) {
    var h = slug.slice(0, 30);
    return [
      ['.com', 'https://www.namecheap.com/domains/registration/results/?domain=' + slug + '.com'],
      ['.ie', 'https://instantdomainsearch.com/?q=' + slug + '.ie'],
      ['.co.uk', 'https://instantdomainsearch.com/?q=' + slug + '.co.uk'],
      ['Instagram', 'https://www.instagram.com/' + h + '/'],
      ['TikTok', 'https://www.tiktok.com/@' + h],
      ['Facebook', 'https://www.facebook.com/' + h],
      ['X', 'https://x.com/' + h.slice(0, 15)]
    ];
  }
  function card(n) {
    var li = el('li', { 'class': 'card' });
    li.appendChild(el('span', { 'class': 'nm' }, n.name));
    li.appendChild(el('span', { 'class': 'tag' }, n.tag + (n.src ? ' · ' + n.src : '')));
    if (n.note) li.appendChild(el('span', { 'class': 'note' }, n.note));
    var a = el('div', { 'class': 'actions' });
    var c = el('button', { type: 'button', 'class': 'ibtn', 'data-copy': n.name, 'aria-label': 'Copy ' + n.name }, 'Copy');
    var f = el('button', { type: 'button', 'class': 'ibtn', 'data-fav': n.slug, 'data-name': n.name, 'aria-pressed': 'false', 'aria-label': 'Save ' + n.name }, '♡ Save');
    var d = el('details', { 'class': 'check' });
    d.appendChild(el('summary', { 'class': 'ibtn' }, 'Check domain'));
    var links = el('div', { 'class': 'checklinks' });
    checkLinks(n.slug).forEach(function (l) {
      links.appendChild(el('a', { href: l[1], target: '_blank', rel: 'nofollow noopener', 'aria-label': 'Check ' + n.slug + ' on ' + l[0] + ' (opens in new tab)' }, l[0]));
    });
    d.appendChild(links);
    a.appendChild(c); a.appendChild(f); a.appendChild(d);
    li.appendChild(a);
    return li;
  }
  function readForm() {
    var style = (form.querySelector('input[name=style]:checked') || {}).value || 'any';
    return { keywords: $('keywords').value.trim(), industry: $('industry').value, style: style };
  }
  function run(append) {
    var o = append ? lastOpts : readForm();
    if (!append) { shown = {}; list.innerHTML = ''; lastOpts = o; }
    var r = window.NameGen.generate({ keywords: o.keywords, industry: o.industry, style: o.style, count: 30, exclude: shown });
    var frag = document.createDocumentFragment();
    r.names.forEach(function (n) { shown[n.slug] = 1; frag.appendChild(card(n)); });
    list.appendChild(frag);
    syncFavButtons();
    resultsWrap.hidden = false;
    var total = list.children.length;
    status.textContent = total + ' names · industry: ' + r.industryLabel + (r.places.length ? ' · location: ' + r.places.join(', ') : '');
    moreBtn.hidden = r.names.length === 0;
    if (!append) {
      var params = new URLSearchParams();
      if (o.keywords) params.set('k', o.keywords);
      if (o.industry && o.industry !== 'auto') params.set('i', o.industry);
      if (o.style && o.style !== 'any') params.set('s', o.style);
      try { history.replaceState(null, '', (params.toString() ? '?' + params.toString() : location.pathname) + '#results-wrap'); } catch (e) { }
    }
  }
  function renderFavs() {
    favList.innerHTML = '';
    favCount.textContent = favs.length;
    favWrap.hidden = favs.length === 0;
    favs.forEach(function (f) {
      var li = el('li'); li.appendChild(el('span', null, f.name));
      var x = el('button', { type: 'button', 'data-unfav': f.slug, 'aria-label': 'Remove ' + f.name }, '×');
      li.appendChild(x); favList.appendChild(li);
    });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(false); $('results-title').focus({ preventScroll: false }); });
  moreBtn.addEventListener('click', function () { run(true); });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-copy')) copy(b.getAttribute('data-copy'));
    if (b.hasAttribute('data-fav')) toggleFav(b.getAttribute('data-name'), b.getAttribute('data-fav'));
  });
  favList.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-unfav]'); if (!b) return;
    favs = favs.filter(function (f) { return f.slug !== b.getAttribute('data-unfav'); });
    saveFavs(favs); renderFavs(); syncFavButtons();
  });
  $('fav-copy').addEventListener('click', function () { if (favs.length) copy(favs.map(function (f) { return f.name; }).join('\n')); });
  $('fav-clear').addEventListener('click', function () { if (confirm('Clear all saved names?')) { favs = []; saveFavs(favs); renderFavs(); syncFavButtons(); } });

  // Restore from a shared link (?k=...&i=...&s=...)
  var q = new URLSearchParams(location.search);
  if (q.get('k')) $('keywords').value = q.get('k');
  if (q.get('i') && $('industry').querySelector('option[value="' + q.get('i') + '"]')) $('industry').value = q.get('i');
  if (q.get('s')) { var r = form.querySelector('input[name=style][value="' + q.get('s') + '"]'); if (r) r.checked = true; }
  renderFavs();
  if (q.get('k') || q.get('i')) run(false);
})();
