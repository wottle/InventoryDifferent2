const express = require('express');
const path = require('path');
const sharp = require('sharp');
const { gql, DEVICES_QUERY, DEVICE_QUERY, CATEGORIES_QUERY } = require('./graphql');

const app = express();
const PORT = process.env.PORT || 3004;
const API_URL = process.env.API_URL || 'http://api:4000';
const PAGE_SIZE = 50;

const VALID_THEMES = ['system7', 'earlyweb', 'platinum'];
const THEME = VALID_THEMES.includes(process.env.RETRO_THEME) ? process.env.RETRO_THEME : 'system7';

const STATUS_LABELS = {
  COLLECTION: 'Collection', FOR_SALE: 'For Sale', PENDING_SALE: 'Pending Sale',
  IN_REPAIR: 'In Repair', REPAIRED: 'Repaired', LOANED: 'Loaned',
  SOLD: 'Sold', DONATED: 'Donated', RETURNED: 'Returned',
};
const FUNCTIONAL_LABELS = { YES: 'Working', PARTIAL: 'Partial', NO: 'Not Working', UNKNOWN: 'Unknown' };
const CONDITION_LABELS = {
  NEW: 'New', LIKE_NEW: 'Like New', VERY_GOOD: 'Very Good',
  GOOD: 'Good', ACCEPTABLE: 'Acceptable', FOR_PARTS: 'For Parts',
};
const RARITY_LABELS = {
  COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare',
  VERY_RARE: 'Very Rare', EXTREMELY_RARE: 'Extremely Rare',
};

// Simple 60-second categories cache
let categoriesCache = null;
let cacheTime = 0;
async function getCategories() {
  if (categoriesCache && Date.now() - cacheTime < 60000) return categoriesCache;
  const data = await gql(CATEGORIES_QUERY);
  categoriesCache = data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  cacheTime = Date.now();
  return categoriesCache;
}

function getThumbnail(images) {
  if (!images?.length) return null;
  return images.find(i => i.isThumbnail) || images[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function safeUrl(u) {
  if (!u) return '#';
  // Allow server-relative paths (can never be javascript:)
  if (u.startsWith('/')) return u;
  try {
    const p = new URL(u);
    return (p.protocol === 'http:' || p.protocol === 'https:' || p.protocol === 'mailto:') ? u : '#';
  } catch { return '#'; }
}

// Share helpers with all templates
app.use((req, res, next) => {
  res.locals.theme = THEME;
  res.locals.STATUS_LABELS = STATUS_LABELS;
  res.locals.FUNCTIONAL_LABELS = FUNCTIONAL_LABELS;
  res.locals.CONDITION_LABELS = CONDITION_LABELS;
  res.locals.RARITY_LABELS = RARITY_LABELS;
  res.locals.getThumbnail = getThumbnail;
  res.locals.formatDate = formatDate;
  res.locals.safeUrl = safeUrl;
  next();
});

// Proxy uploads to avoid exposing internal API URL to browsers
app.get('/uploads/*', async (req, res) => {
  const rel = req.params[0];
  // Validate: only allow path segments of safe characters, no traversal
  if (!rel || !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(rel) || rel.includes('..')) {
    return res.status(400).end();
  }
  try {
    const upstream = await fetch(new URL('/uploads/' + rel, API_URL).href);
    if (!upstream.ok) return res.status(upstream.status).end();
    // Allowlist only safe raster types — SVG can embed JS so it is excluded
    const ct = upstream.headers.get('content-type') || '';
    const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    const baseCt = ct.split(';')[0].trim().toLowerCase();
    if (!SAFE_IMAGE_TYPES.includes(baseCt)) return res.status(403).end();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    let buf = Buffer.from(await upstream.arrayBuffer());
    // Transcode WebP to JPEG for browsers that don't advertise WebP support
    const acceptsWebp = (req.headers['accept'] || '').includes('image/webp');
    if (baseCt === 'image/webp' && !acceptsWebp) {
      buf = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      res.setHeader('Content-Type', baseCt);
    }
    res.end(buf);
  } catch {
    res.status(502).end();
  }
});

app.get('/', (req, res) => res.redirect('/devices'));

app.get('/devices', async (req, res) => {
  const q = (req.query.q || '').trim();
  const categoryId = req.query.category ? parseInt(req.query.category) : null;
  const status = req.query.status || '';
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const where = { deleted: { equals: false } };
    if (status) where.status = { in: [status] };
    if (categoryId) where.category = { id: { in: [categoryId] } };

    const [devicesData, categories] = await Promise.all([
      gql(DEVICES_QUERY, { where }),
      getCategories(),
    ]);

    let devices = devicesData.devices;
    if (q) {
      const ql = q.toLowerCase();
      devices = devices.filter(d => (d.searchText || '').toLowerCase().includes(ql));
    }

    // Sort by name
    devices.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const total = devices.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const pagedDevices = devices.slice(start, start + PAGE_SIZE);

    res.render('devices/index', {
      title: 'All Devices',
      devices: pagedDevices,
      categories,
      q,
      categoryId,
      status,
      page: safePage,
      totalPages,
      total,
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load devices.' });
  }
});

app.get('/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(404).render('error', { title: 'Not Found', message: 'Device not found.' });

  try {
    const data = await gql(DEVICE_QUERY, { where: { id, deleted: { equals: false } } });
    if (!data.device) return res.status(404).render('error', { title: 'Not Found', message: 'Device not found.' });
    res.render('devices/show', { title: data.device.name, device: data.device });
  } catch (e) {
    console.error(e);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load device.' });
  }
});

app.use((req, res) => res.status(404).render('error', { title: 'Not Found', message: 'Page not found.' }));

app.listen(PORT, () => {
  console.log(`Retro server running on port ${PORT} (theme: ${THEME})`);
});
