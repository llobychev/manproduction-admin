'use strict';

(function () {
  const API_BASE = window.MOS_API_BASE || 'https://manproduction-networking-server.onrender.com/mos/v1';
  const app = document.getElementById('app');
  const badge = document.getElementById('overallBadge');
  const pageTitle = document.getElementById('pageTitle');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const cache = {};

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function statusLabel(status) {
    return ({ green: 'Стабильно', yellow: 'Требует внимания', red: 'Критично', planned: 'Запланировано', unknown: 'Неизвестно', pass: 'Пройдено', fail: 'Ошибка', warning: 'Предупреждение', open: 'Открыт', resolved: 'Закрыт' })[status] || status || 'Неизвестно';
  }

  function getFirebaseIdToken() {
    if (!window.firebase || !firebase.auth || !firebase.auth().currentUser) return Promise.resolve(null);
    return firebase.auth().currentUser.getIdToken(true);
  }

  async function request(path) {
    if (cache[path]) return cache[path];
    const token = await getFirebaseIdToken();
    if (!token) throw new Error('Нет подтверждённой Admin Firebase-сессии');
    const response = await fetch(API_BASE + path, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }
    });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || payload.ok !== true) throw new Error(payload.error || ('HTTP ' + response.status));
    cache[path] = payload.data;
    return payload.data;
  }

  function setBadge(text) {
    badge.textContent = text;
    badge.className = 'badge';
  }

  function renderOverview(snapshot) {
    const summary = snapshot.summary || {};
    const services = Array.isArray(snapshot.services) ? snapshot.services : [];
    const attention = Array.isArray(snapshot.attention) ? snapshot.attention : [];
    setBadge(statusLabel(snapshot.overallStatus || 'unknown'));
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
        }).join('') : '<div class="empty">Активных предупреждений нет.</div>'}
      </aside>`;
  }

  function renderServices(registry) {
    const services = Array.isArray(registry.services) ? registry.services : [];
    setBadge(services.length + ' сервисов');
    app.className = 'grid';
    app.innerHTML = '<section class="card wide"><div class="eyebrow">Service Registry</div><table class="table"><thead><tr><th>Сервис</th><th>Тип</th><th>Жизненный цикл</th><th>Критичность</th><th>Зависимости</th><th>Проверки</th></tr></thead><tbody>' + services.map(function (item) {
      return '<tr><td><strong>' + escapeHtml(item.name || item.serviceId) + '</strong><div class="muted">' + escapeHtml(item.serviceId) + '</div></td><td>' + escapeHtml(item.type) + '</td><td><span class="pill">' + escapeHtml(item.lifecycle) + '</span></td><td>' + escapeHtml(item.criticality) + '</td><td>' + escapeHtml((item.dependencies || []).join(', ') || '—') + '</td><td>' + escapeHtml((item.checks || []).join(', ') || '—') + '</td></tr>';
    }).join('') + '</tbody></table><div class="footer-note">Источник: ' + escapeHtml(registry.source || 'service registry') + '</div></section>';
  }

  function renderChecks(payload) {
    const checks = Array.isArray(payload) ? payload : (Array.isArray(payload.checks) ? payload.checks : []);
    setBadge(checks.length + ' проверок');
    app.className = 'grid';
    app.innerHTML = '<section class="card wide"><div class="eyebrow">Checks</div>' + (checks.length ? '<table class="table"><thead><tr><th>Проверка</th><th>Сервис</th><th>Статус</th><th>Сообщение</th><th>Время</th></tr></thead><tbody>' + checks.map(function (item) {
      return '<tr><td><strong>' + escapeHtml(item.checkId || item.id || 'check') + '</strong></td><td>' + escapeHtml(item.serviceId || '—') + '</td><td><span class="pill">' + escapeHtml(statusLabel(item.status)) + '</span></td><td>' + escapeHtml(item.message || item.reason || '—') + '</td><td>' + escapeHtml(item.checkedAt || item.createdAt || 'не задано') + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="empty">Автоматические результаты пока отсутствуют. MOS показывает статический baseline.</div>') + '</section>';
  }

  function renderIncidents(payload) {
    const incidents = Array.isArray(payload) ? payload : (Array.isArray(payload.incidents) ? payload.incidents : []);
    setBadge(incidents.length + ' инцидентов');
    app.className = 'grid';
    app.innerHTML = '<section class="card wide"><div class="eyebrow">Incidents</div>' + (incidents.length ? incidents.map(function (item) {
      return '<div class="incident"><span class="severity ' + escapeHtml(item.severity) + '">' + escapeHtml(item.severity || 'unknown') + '</span><b>' + escapeHtml(item.title || item.code || item.incidentId) + '</b><div class="muted">Статус: ' + escapeHtml(statusLabel(item.status)) + ' · Сервисы: ' + escapeHtml((item.serviceIds || []).join(', ') || '—') + '</div><div style="margin-top:7px">' + escapeHtml(item.recommendedAction || item.nextAction || item.description || '') + '</div></div>';
    }).join('') : '<div class="empty">Инциденты пока не сформированы автоматически.</div>') + '</section>';
  }

  async function loadView(view) {
    tabs.forEach(function (tab) { tab.classList.toggle('active', tab.dataset.view === view); });
    pageTitle.textContent = ({ overview: 'Overview', services: 'Services', checks: 'Checks', incidents: 'Incidents' })[view] || 'MOS';
    app.className = 'loading';
    app.textContent = 'Получаю данные MOS…';
    try {
      if (view === 'overview') return renderOverview(await request('/overview'));
      if (view === 'services') return renderServices(await request('/registry'));
      if (view === 'checks') return renderChecks(await request('/checks'));
      if (view === 'incidents') return renderIncidents(await request('/incidents'));
    } catch (error) {
      setBadge('Недоступно');
      app.className = 'error';
      app.innerHTML = '<strong>Раздел MOS не загружен.</strong><br>' + escapeHtml(error.message) + '<div class="footer-note">Экран работает только после входа через Admin App и развёртывания read-only MOS API.</div>';
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { loadView(tab.dataset.view); });
  });

  loadView('overview');
})();