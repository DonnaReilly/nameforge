/* Business name generator: pure client-side logic, no network calls.
   Exposes window.NameGen (and module.exports for Node tests). */
(function (root) {
  'use strict';

  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var chance = function (p) { return Math.random() < p; };
  var cap = function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w; };
  var plainLower = function (s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
  var slugify = function (s) { return plainLower(s).replace(/&/g, 'and').replace(/[^a-z0-9]/g, ''); };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  /* ---------- Word banks ---------- */
  var INDUSTRIES = {
    general: { label: 'Any / general', syn: [],
      core: ['Spark', 'Bloom', 'North', 'Nest', 'Arc', 'Leaf', 'Wave', 'Peak', 'Kind', 'Oak', 'Fox', 'Lark', 'Harbour', 'Maple'],
      trade: ['Co.', 'Studio', 'Group', 'Collective', 'Works', 'Company'],
      adj: ['Bright', 'Bold', 'Kind', 'True', 'Good', 'Little', 'Clever', 'Honest', 'Simple'],
      nouns: ['Studio', 'Co.', 'Works', 'Collective', 'House', 'Lab', 'Supply'] },
    plumbing: { label: 'Plumbing & heating', syn: ['plumbing', 'plumber', 'plumbers', 'heating', 'boiler', 'boilers', 'pipes', 'drains', 'gas'],
      core: ['Pipe', 'Flow', 'Tap', 'Drain', 'Valve', 'Boiler', 'Water', 'Heat', 'Copper', 'Spanner', 'Wrench', 'Flush'],
      trade: ['Plumbing', 'Plumbing & Heating', 'Plumbers', 'Heating Services', 'Plumbing Services'],
      adj: ['Rapid', 'Reliable', 'Trusty', 'Steady', 'Sure', 'Clear', 'Handy', 'Prompt', 'Local'],
      nouns: ['Pros', 'Doctors', 'Fixers', 'Masters', 'Mates', 'Crew', 'Works', 'Solutions', 'Team'] },
    electrical: { label: 'Electrical', syn: ['electrical', 'electrician', 'electricians', 'electric', 'wiring', 'solar'],
      core: ['Spark', 'Volt', 'Wire', 'Watt', 'Current', 'Circuit', 'Switch', 'Fuse', 'Amp', 'Bolt'],
      trade: ['Electrical', 'Electricians', 'Electrical Services', 'Electrical Contractors'],
      adj: ['Bright', 'Safe', 'Live', 'Rapid', 'Sure', 'Steady', 'Clear'],
      nouns: ['Pros', 'Works', 'Crew', 'Solutions', 'Team', 'Masters'] },
    bakery: { label: 'Bakery & cakes', syn: ['bakery', 'baker', 'bakes', 'baking', 'cakes', 'cake', 'cupcakes', 'bread', 'pastry', 'patisserie'],
      core: ['Crumb', 'Flour', 'Dough', 'Loaf', 'Crust', 'Batch', 'Whisk', 'Butter', 'Sugar', 'Oven', 'Bun', 'Cake', 'Rise'],
      trade: ['Bakery', 'Bakes', 'Bakehouse', 'Cakes', 'Patisserie', 'Bake Shop'],
      adj: ['Golden', 'Warm', 'Fresh', 'Sweet', 'Rustic', 'Homemade', 'Little', 'Proper'],
      nouns: ['Pantry', 'Kitchen', 'Table', 'Corner', 'Hearth', 'Crumbs', 'House'] },
    cafe: { label: 'Café & coffee', syn: ['cafe', 'café', 'coffee', 'coffeeshop', 'espresso', 'tea', 'brunch', 'deli'],
      core: ['Bean', 'Brew', 'Cup', 'Roast', 'Mug', 'Steam', 'Grind', 'Sip', 'Crema', 'Kettle', 'Scone', 'Saucer'],
      trade: ['Café', 'Coffee', 'Coffee House', 'Kitchen', 'Coffee Co.', 'Eatery'],
      adj: ['Cosy', 'Warm', 'Daily', 'Little', 'Good', 'Sunny', 'Slow', 'Proper'],
      nouns: ['Nook', 'Corner', 'House', 'Table', 'Room', 'Counter', 'Hatch', 'Pantry'] },
    beauty: { label: 'Beauty & salon', syn: ['beauty', 'salon', 'nails', 'nail', 'lashes', 'brows', 'hair', 'hairdresser', 'skincare', 'makeup', 'spa', 'aesthetics'],
      core: ['Glow', 'Bloom', 'Lash', 'Brow', 'Silk', 'Velvet', 'Gloss', 'Polish', 'Blush', 'Rose', 'Pearl', 'Luxe'],
      trade: ['Beauty', 'Beauty Studio', 'Aesthetics', 'Nails', 'Salon', 'Skin Clinic', 'Hair & Beauty'],
      adj: ['Radiant', 'Pure', 'Golden', 'Soft', 'Bare', 'Pretty', 'Glossy', 'Velvet'],
      nouns: ['Studio', 'Lounge', 'Room', 'Bar', 'Rooms', 'House', 'Parlour', 'Collective'] },
    tech: { label: 'Tech & software', syn: ['tech', 'technology', 'software', 'app', 'apps', 'it', 'saas', 'digital', 'web', 'ai', 'data', 'computers'],
      core: ['Byte', 'Code', 'Pixel', 'Cloud', 'Logic', 'Data', 'Stack', 'Node', 'Signal', 'Sync', 'Grid', 'Loop'],
      trade: ['Technologies', 'Tech', 'Digital', 'Labs', 'Software', 'Systems'],
      adj: ['Smart', 'Bright', 'Agile', 'Clear', 'Rapid', 'Open', 'Next', 'Swift'],
      nouns: ['Labs', 'Works', 'Systems', 'Hub', 'Studio', 'Forge'] },
    cleaning: { label: 'Cleaning', syn: ['cleaning', 'cleaner', 'cleaners', 'clean', 'housekeeping', 'valeting', 'maid', 'maids'],
      core: ['Sparkle', 'Shine', 'Fresh', 'Gleam', 'Polish', 'Sweep', 'Mop', 'Suds', 'Bubble', 'Clean', 'Dust'],
      trade: ['Cleaning', 'Cleaning Services', 'Cleaners', 'Clean Co.', 'Property Care'],
      adj: ['Spotless', 'Fresh', 'Pristine', 'Tidy', 'Sparkling', 'Clear', 'Crisp'],
      nouns: ['Crew', 'Team', 'Squad', 'Pros', 'Co.', 'Maids'] },
    fitness: { label: 'Fitness & wellness', syn: ['fitness', 'gym', 'personal', 'trainer', 'training', 'pt', 'yoga', 'pilates', 'crossfit', 'wellness', 'coach'],
      core: ['Fit', 'Pulse', 'Core', 'Peak', 'Move', 'Stride', 'Lift', 'Flex', 'Iron', 'Motion', 'Strong'],
      trade: ['Fitness', 'Training', 'Gym', 'Personal Training', 'Performance', 'Studio'],
      adj: ['Strong', 'Bold', 'Active', 'Fierce', 'Peak', 'Lean', 'Mighty'],
      nouns: ['Lab', 'Club', 'Collective', 'Studio', 'Tribe', 'Box', 'Squad'] },
    photography: { label: 'Photography', syn: ['photography', 'photographer', 'photo', 'photos', 'wedding', 'portrait', 'camera', 'video', 'videography'],
      core: ['Lens', 'Frame', 'Light', 'Shutter', 'Focus', 'Moment', 'Snap', 'Glow', 'Pixel', 'Aperture'],
      trade: ['Photography', 'Photo', 'Studios', 'Pictures', 'Imagery'],
      adj: ['Golden', 'Candid', 'Wild', 'Bright', 'True', 'Little', 'Honest'],
      nouns: ['Studio', 'Frames', 'Pictures', 'Stories', 'Collective'] },
    crafts: { label: 'Crafts & handmade', syn: ['crafts', 'craft', 'handmade', 'colouring', 'coloring', 'stickers', 'sticker', 'knitting', 'sewing', 'art', 'prints', 'printables', 'stationery', 'etsy', 'pottery', 'candles', 'jewellery', 'jewelry'],
      core: ['Stitch', 'Thread', 'Paper', 'Craft', 'Doodle', 'Button', 'Ribbon', 'Ink', 'Sticker', 'Crayon', 'Clay', 'Wool', 'Paint', 'Pencil', 'Glitter'],
      trade: ['Crafts', 'Craft Co.', 'Studio', 'Makes', 'Handmade', 'Creations', 'Design Co.'],
      adj: ['Little', 'Handmade', 'Cosy', 'Happy', 'Wonky', 'Tiny', 'Cute', 'Crafty'],
      nouns: ['Studio', 'Workshop', 'Corner', 'Box', 'Nook', 'Lane', 'Loft', 'Club'] },
    consulting: { label: 'Consulting & services', syn: ['consulting', 'consultant', 'consultancy', 'advisory', 'accounting', 'accountant', 'bookkeeping', 'finance', 'legal', 'marketing', 'agency', 'hr', 'coaching'],
      core: ['Insight', 'Compass', 'Bridge', 'Summit', 'Clarity', 'Path', 'Anchor', 'North', 'Keystone', 'Lever', 'Vantage', 'Pillar'],
      trade: ['Consulting', 'Advisory', 'Partners', 'Consultancy', 'Associates', 'Strategy'],
      adj: ['Clear', 'True', 'Bright', 'Sound', 'Wise', 'Sharp', 'Steady'],
      nouns: ['Partners', 'Group', 'Advisory', 'Associates', 'Collective'] },
    pets: { label: 'Pets & grooming', syn: ['pets', 'pet', 'dog', 'dogs', 'cat', 'cats', 'grooming', 'groomer', 'puppy', 'kennel', 'walker'],
      core: ['Paw', 'Tail', 'Whisker', 'Bark', 'Wag', 'Pup', 'Furry', 'Bone', 'Collar'],
      trade: ['Pet Care', 'Grooming', 'Dog Walking', 'Pets', 'Pet Supplies'],
      adj: ['Happy', 'Waggy', 'Fluffy', 'Cosy', 'Muddy', 'Loyal', 'Little'],
      nouns: ['Club', 'Crew', 'Co.', 'Parlour', 'Pantry', 'Pals'] },
    gardening: { label: 'Gardening & landscaping', syn: ['gardening', 'garden', 'gardener', 'landscaping', 'landscape', 'lawn', 'tree', 'florist', 'flowers', 'plants'],
      core: ['Leaf', 'Root', 'Bloom', 'Sprout', 'Fern', 'Moss', 'Acorn', 'Willow', 'Seed', 'Hedge', 'Petal'],
      trade: ['Gardening', 'Landscapes', 'Garden Services', 'Gardens', 'Landscaping'],
      adj: ['Green', 'Wild', 'Evergreen', 'Tidy', 'Leafy', 'Rooted', 'Little'],
      nouns: ['Works', 'Co.', 'Collective', 'Yard', 'Crew', 'House'] }
  };

  var STYLE = {
    modern: { pre: ['Nova', 'Bright', 'Clear', 'Smart', 'Next', 'True', 'Prime', 'Pure', 'Bold', 'Swift', 'Neo', 'Fresh', 'Zen'],
      tails: ['works', 'hub', 'lab', 'base', 'wise', 'ly', 'io', 'ify', 'loop', 'point', 'stack', 'spot', 'craft'],
      suf: ['ly', 'io', 'ify', 'ster', 'ora', 'ix'] },
    playful: { pre: ['Happy', 'Little', 'Busy', 'Cheeky', 'Sunny', 'Jolly', 'Bubbly', 'Dotty', 'Giggly', 'Teeny', 'Wobbly', 'Snappy'],
      tails: ['pop', 'box', 'bug', 'bee', 'nest', 'land', 'club', 'bun', 'patch', 'puff'],
      words: ['Bean', 'Bee', 'Button', 'Pickle', 'Sprout', 'Doodle', 'Pixie', 'Puddle', 'Muffin', 'Noodle', 'Pebble', 'Biscuit', 'Bumble', 'Sprinkle', 'Mochi', 'Dumpling'],
      suf: ['ie', 'y', 'oo', 'ster', 'kins', 'ette'] },
    classic: { pre: ['Heritage', 'Royal', 'Crown', 'Oak', 'Hallmark', 'Sterling', 'Regent', 'Old Mill', 'Abbey', 'Highfield', 'Kingsley', 'Ashford'],
      tails: ['House', 'Mill', 'Works', 'Hall', 'Pantry', 'Yard'],
      end: ['& Co.', '& Sons', '& Daughters', 'Company', 'Brothers', 'Est. ' + new Date().getFullYear()],
      suf: ['ery', 'smith', 'wright'] },
    short: { pre: ['Nova', 'Neo', 'Zen', 'True', 'Pure', 'Bold', 'Prime'], tails: ['ly', 'io', 'hub', 'lab', 'loop', 'ify', 'wise'], suf: ['o', 'a', 'ly', 'io', 'ora', 'ix', 'ex', 'ia', 'ify', 'ster', 'era', 'ino', 'ana'] }
  };

  /* Irish words with meanings. ind: industries they suit ('*' = any) */
  var IRISH = [
    { w: 'Solas', m: 'light', ind: ['*', 'photography', 'electrical', 'beauty'] },
    { w: 'Grá', m: 'love', ind: ['*', 'bakery', 'cafe', 'crafts', 'beauty'] },
    { w: 'Draíocht', m: 'magic', ind: ['crafts', 'beauty', 'photography', 'bakery'] },
    { w: 'Fáilte', m: 'welcome', ind: ['cafe', 'bakery', 'general'] },
    { w: 'Meitheal', m: 'a team working together', ind: ['*', 'consulting', 'cleaning', 'gardening'] },
    { w: 'Croí', m: 'heart', ind: ['*', 'fitness', 'beauty', 'cafe'] },
    { w: 'Sona', m: 'happy', ind: ['*', 'pets', 'crafts', 'cafe'] },
    { w: 'Réalta', m: 'star', ind: ['*', 'beauty', 'tech', 'photography'] },
    { w: 'Nua', m: 'new', ind: ['*', 'tech', 'beauty'] },
    { w: 'Glan', m: 'clean', ind: ['cleaning'] },
    { w: 'Blasta', m: 'tasty', ind: ['bakery', 'cafe'] },
    { w: 'Milis', m: 'sweet', ind: ['bakery', 'cafe', 'crafts'] },
    { w: 'Láidir', m: 'strong', ind: ['fitness', 'consulting', 'plumbing'] },
    { w: 'Tobar', m: 'a well (water)', ind: ['plumbing', 'gardening'] },
    { w: 'Uisce', m: 'water', ind: ['plumbing'] },
    { w: 'Spréach', m: 'spark', ind: ['electrical', 'tech'] },
    { w: 'Snáth', m: 'thread', ind: ['crafts'] },
    { w: 'Arán', m: 'bread', ind: ['bakery', 'cafe'] },
    { w: 'Bláth', m: 'flower / bloom', ind: ['gardening', 'beauty', 'crafts'] },
    { w: 'Grian', m: 'sun', ind: ['*', 'fitness', 'gardening', 'photography'] },
    { w: 'Gleoite', m: 'lovely, cute', ind: ['crafts', 'beauty', 'pets'] },
    { w: 'Sionnach', m: 'fox', ind: ['*', 'tech', 'consulting'] },
    { w: 'Dúlra', m: 'nature', ind: ['gardening', 'beauty'] },
    { w: 'Ádh Mór', m: 'good luck', ind: ['*'] },
    { w: 'Cois Farraige', m: 'by the sea', ind: ['cafe', 'photography', 'general'] },
    { w: 'Saol', m: 'life', ind: ['fitness', 'photography', 'consulting'] },
    { w: 'Ceol', m: 'music', ind: ['*', 'cafe'] },
    { w: 'Madra', m: 'dog', ind: ['pets'] }
  ];
  var IRISH_EN = ['Emerald', 'Clover', 'Celtic', 'Atlantic', 'Hazel', 'Heather', 'Harbour', 'Rowan', 'Willow', 'Hawthorn', 'Wild Atlantic', 'Greenway', 'Holly'];

  /* Places: user keywords matching these are treated as locations. Some get local nicknames. */
  var PLACES = {
    dublin: ['Liffey', 'Fair City', 'Dub', 'Northside', 'Southside'], cork: ['Leeside', 'Rebel', 'Lee'], galway: ['Corrib', 'Tribes', 'Claddagh'],
    limerick: ['Shannon', 'Treaty'], waterford: ['Déise', 'Suir', 'Crystal'], kilkenny: ['Marble City', 'Nore', 'Cats'], belfast: ['Lagan', 'Titanic'],
    sligo: ['Ben Bulben', 'Yeats'], kerry: ['Kingdom', 'Reeks'], donegal: ['Errigal', 'Tír Chonaill'], mayo: ['Nephin', 'Westport'], clare: ['Burren', 'Banner'],
    wicklow: ['Garden', 'Glendalough'], wexford: ['Slaney', 'Model County'], meath: ['Royal', 'Boyne'], louth: ['Wee County', 'Boyne'], kildare: ['Lily White', 'Curragh'],
    derry: ['Foyle', 'Maiden City'], athlone: ['Shannon'], drogheda: ['Boyne'], dundalk: ['Cooley'], navan: ['Boyne'], ennis: ['Banner'], tralee: ['Kingdom'],
    killarney: ['Lakes', 'Kingdom'], bray: ['Seafront'], howth: ['Harbour'], malahide: ['Castle'], swords: [], tipperary: ['Premier'], offaly: ['Faithful'],
    laois: [], carlow: [], leitrim: [], roscommon: [], cavan: [], monaghan: [], longford: [], westmeath: ['Lakeland'], antrim: ['Causeway'], down: ['Mourne'],
    armagh: ['Orchard'], fermanagh: ['Lakeland'], tyrone: ['Sperrin'], ireland: ['Emerald', 'Éire'], london: ['Thames'], manchester: ['Northern'],
    liverpool: ['Mersey'], leeds: [], glasgow: ['Clyde'], edinburgh: ['Forth'], bristol: ['Avon'], cardiff: ['Taff'], birmingham: [], newcastle: ['Tyne']
  };

  var ALLIT_HEADS = 'Able Amber Bold Bright Brilliant Busy Clever Cosy Crafty Daily Dandy Dapper Easy Fresh Friendly Golden Good Grand Happy Handy Honest Jolly Keen Kind Little Lucky Lovely Magic Merry Mighty Modern Neat Noble Perfect Plucky Proper Pure Quick Rapid Royal Simple Smart Snappy Steady Sunny Super Swift Tidy Top Trusty Velvet Warm Wild Wise Zesty'.split(' ');
  var ALLIT_TAILS = 'Academy Bay Boutique Box Bros Cabin Club Collective Company Corner Cove Crew Den Doctors Experts Fixers Folk Garden Guild Hatch Haven Hive House Hub Kitchen Kit Lab Lane Loft Lounge Makers Masters Mates Mill Nest Nook Pantry Parlour Partners Pals Patch Place Point Pros Room Shed Shop Society Solutions Spot Squad Studio Supply Table Team Tribe Workshop Works Yard'.split(' ');

  /* Curated rhyming pairs: only pairs that read as a sensible brand. */
  var RHYMES = 'Bake Make|Shake Bake|Cake Bake|Flow Glow|Glow Go|Grow Glow|Dough Go|Glow Show|Bright Light|Clean Green|Clean Keen|Clean Sheen|Mix Fix|Fix Tricks|Pop Shop|Mop Shop|Mop Pop|Snap Tap|Tap Snap|Brew Crew|Brew Do|True Blue|Spark Mark|Spark Lark|Stitch Switch|Fit Grit|Fit Kit|Knit Kit|Bloom Room|Groom Bloom|Bloom Zoom|Shine Fine|Shine Line|Sweep Keep|Thread Spread|Bread Spread|Crust Trust|Cup Pup|Frame Name|Frame Game|Paw Draw|Sip Tip|Drip Tip|Wag Tag|Lash Flash|Ink Pink|Ink Think|Roast Toast|Roast Coast|Clay Play|Wool Cool|Code Node|Fern Learn|Sew Grow|Lens Friends|Dust Trust|Bean Green|Seed Need|Root Boot|Petal Metal|Pixel Fixel|Doodle Noodle|Sugar Sugar|Paper Caper|Crumb Yum|Brow Wow|Pulse Hustle|Move Groove|Lift Shift|Cloud Proud|Sync Think'.split('|')
    .map(function (p) { return p.split(' '); }).filter(function (p) { return p[0] !== p[1]; });

  var BAD_WORDS = { polio: 1, ebola: 1, cholera: 1, covid: 1, herpes: 1, leper: 1, scabies: 1, rabies: 1, tumor: 1, tumour: 1, lice: 1, nazi: 1, isis: 1 };
  var BLOCK = /(fuck|shit|cunt|dick|cock|piss|slut|whore|nazi|rape|porn|sex|fag|nigg|cum|turd|wank|twat|bitch|arse|butt|fart|poo[^l]|anal|penis|tits)/;

  /* ---------- Helpers ---------- */
  var VOW = 'aeiouy';
  var OK3 = ['str', 'scr', 'spr', 'spl', 'thr', 'chr', 'shr', 'nch', 'tch', 'ght', 'ngl', 'nks', 'rst', 'lth', 'rch', 'nst', 'mbl', 'ndl', 'rtl', 'ckl', 'ntr', 'ndr', 'mpl', 'mpt', 'nkl', 'rkl', 'stl', 'sch', 'lls', 'tts', 'rks', 'lks', 'ngs', 'nts', 'nds', 'rts', 'pps', 'sts', 'cks', 'ffs', 'bbl', 'ppl', 'ttl', 'ddl', 'ggl', 'zzl', 'ffl', 'rld', 'rdl', 'lfr', 'ngw', 'rkb', 'rkf'];

  function pronounceable(word, sourceWords) {
    var s = plainLower(word).replace(/[^a-z]/g, '');
    if (s.length < 3) return false;
    if (/(.)\1\1/.test(s)) return false;
    if (/^(ng|ck|nk|rr|ll|ss|tt|x[^aeiouy])/.test(s)) return false;
    if (/[qjv]$/.test(s) || /q[^u]/.test(s) || /[^aeiou]h[^aeiouy]/.test(s.replace(/(ch|sh|th|ph|wh|gh)/g, ''))) return false;
    var runC = s.match(/[^aeiouy]+/g) || [], runV = s.match(/[aeiouy]+/g) || [];
    for (var i = 0; i < runC.length; i++) {
      var r = runC[i];
      if (r.length > 3) { if (!(sourceWords || []).some(function (w) { return plainLower(w).indexOf(r) >= 0; })) return false; }
      if (r.length === 3 && OK3.indexOf(r) < 0) { if (!(sourceWords || []).some(function (w) { return plainLower(w).indexOf(r) >= 0; })) return false; }
    }
    for (var j = 0; j < runV.length; j++) {
      if (runV[j].length > 2 && !(sourceWords || []).some(function (w) { return plainLower(w).indexOf(runV[j]) >= 0; })) return false;
    }
    return true;
  }

  /* Join two words into one: "Pipe"+"works" -> "Pipeworks"; merges a doubled boundary letter. */
  function joinWords(a, b) {
    var x = plainLower(a), y = plainLower(b);
    if (x.slice(-1) === y.charAt(0)) y = y.slice(1);
    return cap(a.normalize('NFC')).slice(0, 1) + (x.slice(1) + y);
  }
  function addSuffix(word, suf) {
    var w = plainLower(word);
    if (/[aeiou]{2}$/.test(w)) return null;
    if (/^[aeiouy]/.test(suf) && /[aeiou]$/.test(w)) w = w.slice(0, -1);
    if (/^y/.test(suf) && /y$/.test(w)) return null;
    if (w.slice(-1) === suf.charAt(0)) w = w.slice(0, -1);
    if (suf === 'ie' && /[ye]$/.test(w)) return null;
    return cap(w + suf);
  }
  /* First syllable-ish chunk: "Kawaii"->"kaw", "Dublin"->"dub", "Flow"->"flow" */
  function head(word) {
    var w = plainLower(word).replace(/[^a-z]/g, '');
    var m = w.match(/^[^aeiouy]*[aeiouy]+[^aeiouy]?/);
    return m ? m[0] : w;
  }
  function overlapBlend(a, b) {
    var x = plainLower(a), y = plainLower(b);
    if (x === y || x.indexOf(y) >= 0 || y.indexOf(x) >= 0) return null;
    for (var k = Math.min(x.length, y.length) - 1; k >= 2; k--) {
      if (x.slice(-k) === y.slice(0, k)) return cap(x + y.slice(k));
    }
    return null;
  }
  function plural(w) { return /s$/.test(w) ? w : (/(ch|sh|x)$/.test(w) ? w + 'es' : w + 's'); }

  /* ---------- Context from user input ---------- */
  function parseInput(keywords, industryKey) {
    var raw = String(keywords || '').split(/[,;\/\n]+|\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var seen = {}, themes = [], places = [], industryWords = [], autoInd = null;
    raw.forEach(function (w) {
      var l = plainLower(w).replace(/[^a-z0-9'-]/g, '');
      if (!l || seen[l] || /^(and|the|of|for|my|a|an|in|&)$/.test(l)) return;
      seen[l] = 1;
      if (PLACES.hasOwnProperty(l)) { places.push(cap(l)); return; }
      for (var k in INDUSTRIES) {
        if (INDUSTRIES[k].syn.indexOf(l) >= 0) { if (!autoInd) autoInd = k; industryWords.push(cap(l)); return; }
      }
      if (l.length >= 2 && l.length <= 14) themes.push(cap(l.replace(/[^a-z0-9]/g, '')));
    });
    var ik = (industryKey && INDUSTRIES[industryKey] && industryKey !== 'auto') ? industryKey : (autoInd || 'general');
    var ind = INDUSTRIES[ik];
    // Craft-type keyword the user typed (e.g. "Colouring") is a good theme for crafts/photography style names.
    var userTrade = industryWords.filter(function (w) { return !/(ing|er|ers)$/.test(plainLower(w)) || ik === 'crafts'; });
    var coreThemes = themes.length ? themes : [];
    return { industryKey: ik, ind: ind, themes: coreThemes, places: places, industryWords: industryWords, userTrade: userTrade };
  }

  /* ---------- Techniques ---------- */
  function T(ctx) {
    var ind = ctx.ind;
    var themeOrCore = function () { return (ctx.themes.length && chance(0.6)) ? rnd(ctx.themes) : rnd(ind.core); };
    var trade = function () {
      var list = ind.trade.slice();
      ctx.industryWords.forEach(function (w) { if (ctx.industryKey === 'crafts' || /ing$/.test(plainLower(w))) list.push(w); });
      return rnd(list);
    };
    var anyTheme = function () { return ctx.themes.length ? rnd(ctx.themes) : null; };
    var place = function () { return ctx.places.length ? rnd(ctx.places) : null; };
    var nick = function () {
      var p = ctx.places.filter(function (x) { return PLACES[plainLower(x)] && PLACES[plainLower(x)].length; });
      return p.length ? rnd(PLACES[plainLower(rnd(p))]) : null;
    };
    var irishFor = function () {
      var pool = IRISH.filter(function (x) { return x.ind.indexOf(ctx.industryKey) >= 0; });
      if (pool.length < 4 || chance(0.35)) pool = pool.concat(IRISH.filter(function (x) { return x.ind.indexOf('*') >= 0; }));
      return rnd(pool);
    };

    return {
      compound: function (style) {
        var base = themeOrCore();
        if (base.length > 9) return null;
        var tails = (STYLE[style] && STYLE[style].tails) || STYLE.modern.tails.concat(['nest', 'club', 'box']);
        var t = rnd(tails);
        if (t.length <= 3 && /^(ly|io|ify)$/.test(t)) { if (base.length > 6) return null; var s = addSuffix(base, t); return s && { name: s, tag: 'Compound' }; }
        var spaced = /^[A-Z]/.test(t) || STYLE.playful.tails.indexOf(t) >= 0;
        if (!spaced && chance(0.75)) return { name: joinWords(base, t), tag: 'Compound', check: [base, t] };
        return { name: base + ' ' + cap(t), tag: 'Compound' };
      },
      prefix: function (style) {
        var pre = rnd((STYLE[style] && STYLE[style].pre) || STYLE.modern.pre.concat(STYLE.playful.pre));
        var base = themeOrCore();
        if (plainLower(pre) === plainLower(base)) return null;
        if (chance(0.5) && pre.length + base.length <= 11 && STYLE.modern.pre.indexOf(pre) >= 0) return { name: joinWords(pre, base), tag: 'Prefix', check: [pre, base] };
        return { name: pre + ' ' + (chance(0.5) ? base : trade()), tag: 'Prefix' };
      },
      descriptive: function () {
        var p = place(), th = anyTheme(), c = rnd(ind.core), a = rnd(ind.adj), tr = trade();
        var opts = [];
        if (p) opts.push(p + ' ' + c + ' ' + tr, p + ' ' + tr, a + ' ' + p + ' ' + tr);
        if (th) opts.push(th + ' ' + tr, th + ' ' + c + ' ' + rnd(ind.nouns), a + ' ' + th + ' ' + rnd(ind.nouns));
        opts.push(a + ' ' + c + ' ' + tr, c + ' & ' + rnd(ind.core) + ' ' + tr, a + ' ' + c + ' ' + rnd(ind.nouns));
        var n = rnd(opts);
        if (/(\b\w+\b).*\b\1\b/i.test(n)) return null;
        return { name: n, tag: 'Descriptive' };
      },
      blend: function () {
        var words = ctx.themes.concat(ind.core, ind.adj, STYLE.modern.pre, ctx.style === 'playful' ? STYLE.playful.words : []);
        for (var i = 0; i < 25; i++) {
          var a = (ctx.themes.length && chance(0.6)) ? rnd(ctx.themes) : rnd(ind.core), b = rnd(words);
          if (chance(0.5)) { var t = a; a = b; b = t; }
          var r = overlapBlend(a, b);
          if (r && r.length >= 5 && r.length <= 12) return { name: r, tag: 'Blend', check: [a, b], src: a + ' + ' + b };
        }
        // mash-up: two short related words joined, e.g. Flowpipe, Brewbean
        var m1 = themeOrCore(), m2 = rnd(ind.core);
        if (m1 === m2 || m1.length > 6 || m2.length > 5 || plainLower(m1).slice(-1) === plainLower(m2).charAt(0)) return null;
        return { name: joinWords(m1, m2), tag: 'Blend', check: [m1, m2], src: m1 + ' + ' + m2 };
      },
      alliteration: function () {
        var lead = (ctx.places.length && chance(0.4)) ? rnd(ctx.places) : themeOrCore();
        if (ctx.places.indexOf(lead) >= 0) {
          var pc = ind.core.filter(function (w) { return plainLower(w).charAt(0) === plainLower(lead).charAt(0); });
          var pt = ind.nouns.concat(ALLIT_TAILS).filter(function (w) { return plainLower(w).charAt(0) === plainLower(lead).charAt(0); });
          if (pc.length && pt.length) return { name: lead + ' ' + rnd(pc) + ' ' + rnd(pt), tag: 'Alliteration' };
          if (pc.length) return { name: lead + ' ' + rnd(pc) + ' ' + rnd(ind.trade), tag: 'Alliteration' };
          lead = themeOrCore();
        }
        var L = plainLower(lead).charAt(0);
        var heads = ALLIT_HEADS.concat(ind.adj).filter(function (w) { return plainLower(w).charAt(0) === L && w !== lead; });
        var tailsN = ALLIT_TAILS.concat(ind.nouns).filter(function (w) { return plainLower(w).charAt(0) === L && w !== lead; });
        var tails = ALLIT_TAILS.concat(ind.nouns, ind.core).filter(function (w) { return plainLower(w).charAt(0) === L && w !== lead; });
        if (!tails.length && !heads.length) return null;
        var n;
        if (tailsN.length && heads.length && chance(0.4)) n = rnd(heads) + ' ' + lead + ' ' + rnd(tailsN);
        else if (tails.length) {
          var t1 = rnd(tails), t2 = rnd(tails);
          n = (t1 !== t2 && chance(0.4) && ind.core.indexOf(t1) >= 0 && ind.core.indexOf(t2) < 0) ? lead + ' ' + t1 + ' ' + t2 : lead + ' ' + t1;
        } else n = rnd(heads) + ' ' + lead;
        if (n.split(' ').length < 2) return null;
        return { name: n, tag: 'Alliteration' };
      },
      rhyme: function (style) {
        var cands = ctx.themes.concat(ind.core, ind.adj).map(plainLower);
        var hits = RHYMES.filter(function (p) { return cands.indexOf(p[0].toLowerCase()) >= 0 || cands.indexOf(p[1].toLowerCase()) >= 0; });
        if (!hits.length) return null;
        var h = rnd(hits), A = h[0], B = h[1];
        var forms = [A + ' & ' + B, A + ' & ' + B + ' Co.'];
        if (style === 'playful' || style === null) forms.push(A + ' n ' + B, A + ' n ' + B + ' Club');
        return { name: rnd(forms), tag: 'Rhyme' };
      },
      brandable: function () {
        if (chance(0.55)) {
          var src = themeOrCore(), h = head(src), suf = rnd(STYLE.short.suf);
          var w = addSuffix(h, suf);
          if (!w || plainLower(w) === plainLower(src) || w.length < 4 || w.length > 9) return null;
          return { name: w, tag: 'Brandable', check: [src], src: 'from ' + src };
        }
        var onsets = ['b', 'br', 'c', 'cl', 'd', 'f', 'fl', 'g', 'gr', 'k', 'l', 'm', 'n', 'p', 'pl', 'pr', 'r', 's', 'sk', 'st', 't', 'tr', 'v', 'z'];
        var first = plainLower(themeOrCore()).charAt(0);
        var on = chance(0.6) ? (onsets.filter(function (o) { return o.charAt(0) === first; })[0] || first) : rnd(onsets);
        var v = ['a', 'e', 'i', 'o', 'u', 'a', 'o', 'i'], mid = ['b', 'd', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v', 'z', 'l', 'm', 'n', 'r', 'v'];
        var end = ['a', 'o', 'i', 'ia', 'io', 'ly', 'on', 'ora', 'ex', 'ix', 'era', 'ana', 'ova', 'ar', 'ena', 'ito'];
        var w2 = on + rnd(v) + rnd(mid) + rnd(end);
        if (w2.length < 4 || w2.length > 7 || /^(.)[aeiou]\1/.test(w2)) return null;
        return { name: cap(w2), tag: 'Brandable', check: [] };
      },
      suffix: function (style) {
        var base = themeOrCore();
        if (base.length > 8) return null;
        var list = (STYLE[style] && STYLE[style].suf) || STYLE.modern.suf;
        var sf = rnd(list);
        if (base.length > (sf === 'ify' || sf === 'ly' ? 6 : 5)) return null;
        if (/(er|ar|or)$/i.test(base) && /^(ery|ster|er|ora|era)$/.test(sf)) return null;
        var w = addSuffix(base, sf);
        if (!w || w.length > 11) return null;
        return { name: w, tag: 'Suffix', check: [base] };
      },
      local: function () {
        var nk = nick(), p = place(), ir = irishFor(), c = rnd(ind.core), tr = trade();
        var en = rnd(IRISH_EN), th = anyTheme();
        var opts = [
          { name: ir.w + ' ' + tr, note: ir.w + ' = ' + ir.m },
          { name: (ir.w.indexOf(' ') < 0 && /bakery|cafe|crafts|beauty|gardening|pets/.test(ctx.industryKey)) ? ir.w + ' & ' + c : ir.w + ' ' + tr, note: ir.w + ' = ' + ir.m },
          { name: 'The ' + ir.w + ' ' + rnd(ind.nouns), note: ir.w + ' = ' + ir.m },
          { name: en + ' ' + c + ' ' + tr },
          { name: en + ' ' + tr }
        ];
        if (th) opts.push({ name: ir.w + ' ' + th, note: ir.w + ' = ' + ir.m }, { name: en + ' ' + th + ' ' + rnd(ind.nouns) });
        if (nk) opts.push({ name: nk + ' ' + tr }, { name: nk + ' ' + c + ' ' + rnd(ind.nouns) }, { name: joinWords(nk.split(' ')[0], c.toLowerCase()) + ' ' + tr }, { name: nk + ' ' + c + ' Co.' });
        if (p) opts.push({ name: p + ' ' + c + ' Co.' }, { name: p + ' ' + tr });
        var o = rnd(opts);
        if (/(\b\w+\b).*\b\1\b/i.test(o.name)) return null;
        return { name: o.name, tag: 'Irish / local', note: o.note };
      },
      phrase: function (style) {
        var c = rnd(ind.core), c2 = rnd(ind.core), th = anyTheme() || c, pw = rnd(STYLE.playful.words);
        var opts;
        if (style === 'playful') opts = ['Little ' + th + ' ' + rnd(['Co.', 'Club', 'Shop', 'Studio']), 'The Happy ' + c, th + ' & ' + pw, rnd(STYLE.playful.pre) + ' ' + c + ' Club', 'Oh My ' + c, 'Hello ' + pw, 'Two Little ' + plural(c), 'Mr ' + pw + "'s " + plural(c)];
        else if (style === 'classic') opts = [th + ' ' + rnd(STYLE.classic.end), 'The ' + th + ' Company', c + ' & ' + c2, 'The ' + c + ' House', rnd(STYLE.classic.pre) + ' ' + trade(), rnd(STYLE.classic.pre) + ' ' + c + ' ' + rnd(STYLE.classic.end)];
        else opts = ['Hey ' + c, c + ' + ' + c2, 'The ' + c + ' Lab', th + ' & ' + c, 'Good ' + c + ' Co.'].concat(ctx.themes.length ? [th + ' Studio', th + ' & Co.'] : []);
        var n = rnd(opts);
        if (/(\b\w+\b).*\b\1\b/i.test(n.replace(/&|Co\.|The/g, ''))) return null;
        return { name: n, tag: 'Phrase' };
      }
    };
  }

  var WEIGHTS = {
    any: { compound: 3, prefix: 2, descriptive: 3, blend: 2, alliteration: 3, rhyme: 1, brandable: 3, suffix: 1, local: 1, phrase: 2 },
    modern: { compound: 4, prefix: 3, descriptive: 1, blend: 3, alliteration: 1, rhyme: 1, brandable: 3, suffix: 3, local: 0, phrase: 2 },
    playful: { compound: 2, prefix: 3, descriptive: 1, blend: 2, alliteration: 3, rhyme: 2, brandable: 1, suffix: 2, local: 0, phrase: 4 },
    classic: { compound: 2, prefix: 2, descriptive: 4, blend: 0, alliteration: 2, rhyme: 1, brandable: 0, suffix: 1, local: 1, phrase: 4 },
    short: { compound: 2, prefix: 1, descriptive: 0, blend: 3, alliteration: 0, rhyme: 0, brandable: 5, suffix: 3, local: 0, phrase: 0 },
    irish: { compound: 1, prefix: 0, descriptive: 2, blend: 1, alliteration: 2, rhyme: 0, brandable: 0, suffix: 0, local: 6, phrase: 1 }
  };

  function quality(c, ctx) {
    var n = c.name;
    if (!n || n.length < 3 || n.length > 34) return false;
    var slug = slugify(n);
    if (slug.length < 3) return false;
    if (plainLower(n).split(/[^a-z]+/).some(function (x) { return BAD_WORDS[x]; })) return false;
    if (BLOCK.test(slug) && !ctx.themes.concat(ctx.places).some(function (t) { return BLOCK.test(plainLower(t)); })) return false;
    if (n.split(' ').length > 4) return false;
    if (n.indexOf(' ') < 0 || c.check) {
      var single = n.indexOf(' ') < 0 ? n : null;
      if (single && !pronounceable(single, (c.check || []).concat(ctx.themes, ctx.ind.core))) return false;
    }
    if (ctx.style === 'short' && slug.length > 12) return false;
    return true;
  }

  function score(c, ctx) {
    var s = 1 + Math.random();
    var L = slugify(c.name).length;
    if (L >= 5 && L <= 14) s += 0.6; else if (L > 20) s -= 0.6;
    if (ctx.themes.some(function (t) { return c.name.indexOf(t) >= 0; })) s += 0.4;
    if (ctx.places.some(function (t) { return c.name.indexOf(t) >= 0; })) s += 0.2;
    return s;
  }

  /* Main API: returns `count` names not in `exclude` (object of slug->1). */
  function generate(opts) {
    opts = opts || {};
    var style = opts.style && WEIGHTS[opts.style] ? opts.style : 'any';
    var ctx = parseInput(opts.keywords, opts.industry);
    ctx.style = style;
    var tech = T(ctx), w = WEIGHTS[style], count = opts.count || 30, exclude = opts.exclude || {};
    if (style === 'irish' && !ctx.places.length) w = Object.assign({}, w, { local: 6, alliteration: 2 });
    var buckets = {}, seen = {}, headUse = {}, wordUse = {};
    Object.keys(w).forEach(function (k) { if (w[k] > 0) buckets[k] = []; });
    var tries = 0, keys = Object.keys(buckets);
    while (tries++ < 2500) {
      var k = keys[tries % keys.length];
      if (buckets[k].length >= count) continue;
      var c;
      try { c = tech[k](style === 'any' ? null : style); } catch (e) { c = null; }
      if (!c || !quality(c, ctx)) continue;
      var key = slugify(c.name);
      var stem = plainLower(c.name).replace(/&/g, 'and').split(/[^a-z0-9]+/).map(function (x) { return x.replace(/(ers|er|ing|s)$/, ''); }).join('');
      if (seen[key] || exclude[key] || seen['~' + stem]) continue;
      seen[key] = 1; seen['~' + stem] = 1;
      c.slug = key; c.score = score(c, ctx);
      buckets[k].push(c);
    }
    keys.forEach(function (k) { buckets[k].sort(function (a, b) { return b.score - a.score; }); });
    // Weighted round-robin so every technique contributes, and no first word dominates.
    var out = [], total = keys.reduce(function (s, k) { return s + w[k]; }, 0), guard = 0;
    while (out.length < count && guard++ < 500) {
      var progress = false;
      for (var i = 0; i < keys.length && out.length < count; i++) {
        var kk = keys[i], take = Math.max(1, Math.round(w[kk] * count / total / 3));
        for (var j = 0; j < take && buckets[kk].length && out.length < count; j++) {
          var cand = buckets[kk].shift(), first = plainLower(cand.name.split(' ')[0]);
          var ws = plainLower(cand.name).replace(/[^a-z ]/g, '').split(' ').filter(function (x) { return x.length > 2 && !/^(the|and|co)$/.test(x); });
          var slugC = cand.slug, themeHit = ctx.themes.filter(function (t) { return slugC.indexOf(plainLower(t)) >= 0; });
          ws = ws.concat(themeHit.map(function (t) { return '~' + plainLower(t); }));
          var over = ws.some(function (x) { var lim = x.charAt(0) === '~' ? (ctx.style === 'short' ? 10 : 12) : ctx.themes.some(function (t) { return plainLower(t) === x; }) ? 6 : (ctx.places.some(function (t) { return plainLower(t) === x; }) ? 5 : 3); return (wordUse[x] || 0) >= lim; });
          if (((headUse[first] || 0) >= 3 || over) && buckets[kk].length) { buckets[kk].push(cand); continue; }
          if (over) continue;
          headUse[first] = (headUse[first] || 0) + 1;
          ws.forEach(function (x) { wordUse[x] = (wordUse[x] || 0) + 1; });
          out.push(cand); progress = true;
        }
      }
      if (!progress) break;
    }
    return { names: shuffle(out), industry: ctx.industryKey, industryLabel: ctx.ind.label, places: ctx.places, themes: ctx.themes };
  }

  var api = { generate: generate, slugify: slugify, industries: Object.keys(INDUSTRIES).map(function (k) { return { key: k, label: INDUSTRIES[k].label }; }), _pronounceable: pronounceable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NameGen = api;
})(this);
