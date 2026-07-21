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
const loadOpenMarker = "window.addEventListener('load',function(){";
const loadCloseMarker = "  });\n});\n\nfunction showScreen(id){";

if (!bootstrap.includes("SOURCE='admin-app.html?v=20260721-authfix2'")) fail('index.html does not load the versioned preserved app');
if (!bootstrap.includes(activeServer)) fail('active production backend is missing');
if (!bootstrap.includes(retiredServer)) fail('retired backend replacement marker is missing');
if (!bootstrap.includes('xhr.timeout=10000')) fail('auth request timeout is missing');
if (!bootstrap.includes('function __adminAppBoot()')) fail('explicit app boot transform is missing');
if (!bootstrap.includes('window.__adminAppBooted')) fail('idempotent boot guard is missing');
if (!bootstrap.includes("'<scr'+'ipt>__adminAppBoot();</scr'+'ipt>")) fail('explicit boot call is missing or invalid');
if (!bootstrap.includes("requireMarker(html,LOAD_OPEN_MARKER,'load open')")) fail('load-open fail-closed validation is missing');
if (!bootstrap.includes("requireMarker(html,LOAD_CLOSE_MARKER,'load close')")) fail('load-close fail-closed validation is missing');
if (!bootstrap.includes('Не удалось загрузить админку')) fail('visible bootstrap error state is missing');
if (!app.includes(`var AUTH_SERVER='${retiredServer}'`)) fail('preserved app no longer matches expected pre-hotfix backend marker');
if (!app.includes(authMarker)) fail('preserved app auth request marker is missing');
if (!app.includes(loadOpenMarker)) fail('preserved app load-open marker is missing');
if (!app.includes(loadCloseMarker)) fail('preserved app load-close marker is missing');

console.log('admin-auth-bootstrap validation passed');
