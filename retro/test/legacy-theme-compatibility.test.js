const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const retroRoot = path.join(__dirname, '..');
const legacyThemePaths = ['system7.css', 'earlyweb.css'].map((filename) =>
  path.join(retroRoot, 'src', 'public', 'themes', filename)
);

function checkLegacyCss() {
  const unsupportedPatterns = [
    /(?:repeating-)?linear-gradient\s*\(/i,
    /display\s*:\s*(?:flex|grid|inline-flex|inline-grid)/i,
    /var\s*\(/i,
    /(?:^|[;{]\s*)--[a-z-]+\s*:/im,
    /@(?:media|supports|font-face|keyframes)\b/i,
    /\b(?:transform|transition|animation|box-shadow|text-shadow|border-radius|object-fit)\s*:/i,
    /::(?:before|after)\b/i,
    /:first-child\b/i,
    /\[[^\]]+\]/,
  ];

  for (const themePath of legacyThemePaths) {
    const css = fs.readFileSync(themePath, 'utf8');
    for (const pattern of unsupportedPatterns) {
      assert.strictEqual(
        pattern.test(css),
        false,
        `${path.basename(themePath)} uses unsupported CSS matching ${pattern}`
      );
    }
  }
}

function checkIdentityStripe() {
  const header = fs.readFileSync(
    path.join(retroRoot, 'src', 'views', 'partials', 'header.ejs'),
    'utf8'
  );

  for (const className of [
    'rainbow-stripe',
    'stripe-green',
    'stripe-yellow',
    'stripe-orange',
    'stripe-red',
    'stripe-purple',
    'stripe-blue',
  ]) {
    assert.ok(header.includes(`class="${className}"`), `header is missing ${className}`);
  }
}

function checkLegacyMarkupHooks() {
  const index = fs.readFileSync(
    path.join(retroRoot, 'src', 'views', 'devices', 'index.ejs'),
    'utf8'
  );
  const show = fs.readFileSync(
    path.join(retroRoot, 'src', 'views', 'devices', 'show.ejs'),
    'utf8'
  );

  assert.ok(index.includes('class="search-input"'), 'search field needs a CSS1 class hook');
  assert.ok(show.includes('class="spec-label"'), 'specification labels need a CSS1 class hook');
}

checkLegacyCss();
checkIdentityStripe();
checkLegacyMarkupHooks();
console.log('Legacy theme compatibility checks passed.');
