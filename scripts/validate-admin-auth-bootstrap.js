'use strict';

const fs = require('fs');

function fail(message) {
  console.error(`admin-auth-bootstrap validation failed: ${message}`);
  process.exit(1);
}

const bootstrap = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('admin-app.html', 'utf8');

const activeServer = 'https://llobychev-manproduction-networking-server-0fdf.twc1.net';
const retiredServer = 'https://llobychev-manproduction-networking-server-6f2d.twc1.net';
const authMarker = "xhr.open('POST',AUTH_SERVER+'/auth/admin',true);";

if (!bootstrap.includes("SOURCE='admin-app.html")) fail('index.html does not load admin-app.html');
if (!bootstrap.includes(activeServer)) fail('active production backend is missing');
if (!bootstrap.includes(retiredServer)) fail('retired backend replacement marker is missing');
if (!bootstrap.includes('xhr.timeout=10000')) fail('auth request timeout is missing');
if (!bootstrap.includes('Не удалось загрузить админку')) fail('visible bootstrap error state is missing');
if (!app.includes(`var AUTH_SERVER='${retiredServer}'`)) fail('preserved app no longer matches expected pre-hotfix backend marker');
if (!app.includes(authMarker)) fail('preserved app auth request marker is missing');

console.log('admin-auth-bootstrap validation passed');
