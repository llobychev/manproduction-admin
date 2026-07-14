'use strict';

(function () {
  const API_BASE = window.MOS_API_BASE || 'https://manproduction-networking-server.onrender.com/mos/v1';
  const app = document.getElementById('app');
  const badge = document.getElementById('overallBadge');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function statusLabel(status) {
    return ({ green: 'Стабильно', yellow: 'Требует внимания', red: 'Критично', planned: 'Запланировано', unknown: 'Неизвестно' })[status] || status;
  }

  function getFirebaseIdToken() {
    if (!window.firebase || !firebase.auth || !firebase.auth().currentUser) return Promise.resolve(null);
    return firebase.auth().currentUser.getIdToken(true);
  }

  async function request(path) {
    const token = await getFirebaseIdToken();
    if (!token) throw new Error('Нет подтверждённой Admin Firebase-сессии');
    const response = await fetch(API_BASE + path, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
    });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || payload.ok !== true) throw new Error(payload.error || ('HTTP ' + response.status));
    return payload.data;
  }

  function render(snapshot) {
    const summary = snapshot.summary || {};
    const services = Array.isArray(snapshot.services) ? snapshot.services : [];
    const attention = Array.isArray(snapshot.attention) ? snapshot.attention : [];
    const overall = snapshot.overallStatus || 'unknown';

    badge.textContent = statusLabel(overall);
    badge.className = 'badge';

    app.className = 'grid';
    app.innerHTML = `
      <section class="card summary">
        <div class="eyebrow">Сводка</div>
        <div class="statrow">
          ${['green','yellow','red','unknown','planned'].map(function (key) {
            return '<div class="stat"><span class="muted">' + escapeHtml(statusLabel(key)) + '</span><strong>' + escapeHtml(summary[key] || 0) + '</strong></div>';
          }).join('')}
        </div>
        <div class="footer-note">Источник: ${escapeHtml(snapshot.snapshotType || 'unknown')} · generatedAt: ${escapeHtml(snapshot.generatedAt || 'не задан')}</div>
      </section>
      <section class="card services">
        <div class="eyebrow">Сервисы</div>
        <div class="status-list">
          ${services.map(function (item) {
            return '<div class="service"><div><span class="dot ' + escapeHtml(item.status) + '"></span><strong>' + escapeHtml(item.serviceId) + '</strong><div class="muted">' + escapeHtml(item.reason || '') + '</div></div><span>' + escapeHtml(statusLabel(item.status)) + '</span></div>';
          }).join('')}
        </div>
      </section>
      <aside class="card attention">
        <div class="eyebrow">Требует внимания</div>
        ${attention.length ? attention.map(function (item) {
          return '<div class="incident"><span class="severity ' + escapeHtml(item.severity) + '">' + escapeHtml(item.severity) + '</span><b>' + escapeHtml(item.title) + '</b><div class="muted">' + escapeHtml(item.nextAction || '') + '</div></div>';
        }).join('') : '<div class="muted" style="margin-top:14px">Активных предупреждений нет.</div>'}
      </aside>`;
  }

  async function boot() {
    try {
      const overview = await request('/overview');
      render(overview);
    } catch (error) {
      badge.textContent = 'Недоступно';
      app.className = 'error';
      app.innerHTML = '<strong>MOS Overview не загружен.</strong><br>' + escapeHtml(error.message) + '<div class="footer-note">Экран работает только после входа через Admin App и развёртывания read-only MOS API.</div>';
    }
  }

  boot();
})();
