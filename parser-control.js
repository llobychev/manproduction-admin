(function(){
  'use strict';

  var state={manifest:null,preflight:null,handoffs:[],runs:[]};
  var BLOCKER_LABELS={
    deployment_revision_missing:'Не указана версия развёртывания',
    internal_secret_missing:'Не настроен внутренний секрет',
    worker_mode_invalid:'Некорректный режим worker',
    send_flag_without_send_mode:'Отправка включена, но worker не в режиме send',
    send_mode_without_send_flag:'Worker в режиме send, но флаг отправки выключен',
    send_enabled_without_bot_token:'Отправка включена без токена Telegram-бота',
    internal_secret:'Не настроен внутренний секрет',
    single_destination:'Должен быть разрешён ровно один тестовый получатель',
    single_operator:'Должен быть разрешён ровно один оператор',
    action_secret:'Не настроен секрет действий',
    webhook_secret:'Не настроен секрет callback webhook',
    bot_token:'Не настроен токен Telegram-бота',
    signal_persistence:'Сохранение сигналов выключено',
    outbox:'Очередь уведомлений выключена',
    actions:'Действия уведомлений выключены',
    callbacks:'Callback-обработчики выключены',
    callback_answer:'Ответ на callback выключен',
    send_enabled:'Отправка Telegram выключена',
    worker_send_mode:'Worker работает в dry_run'
  };
  var CHECK_LABELS={
    internal_secret:'Внутренний секрет',single_destination:'Один тестовый получатель',single_operator:'Один оператор',
    action_secret:'Секрет действий',webhook_secret:'Секрет webhook',bot_token:'Токен Telegram-бота',
    signal_persistence:'Сохранение сигналов',outbox:'Очередь уведомлений',actions:'Действия уведомлений',
    callbacks:'Callback-обработчики',callback_answer:'Ответ на callback',send_enabled:'Отправка Telegram',worker_send_mode:'Worker в режиме send'
  };

  function el(id){return document.getElementById(id);}
  function escapeHtml(value){
    if(typeof window.escHtml==='function')return window.escHtml(String(value==null?'':value));
    return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtTime(value){
    if(!value)return '—';
    try{return new Date(Number(value)).toLocaleString('ru-RU');}catch(e){return '—';}
  }
  function statusPill(ok,yes,no){
    return '<span class="pc-pill '+(ok?'ok':'bad')+'">'+(ok?'✅ ':'⛔ ')+escapeHtml(ok?yes:no)+'</span>';
  }
  function notify(message){
    if(typeof window.showToast==='function')window.showToast(message);
    var target=el('pc-message');
    if(target){target.textContent=message;target.style.display='block';setTimeout(function(){target.style.display='none';},3500);}
  }
  function apiRequest(method,path,body){
    if(!window.firebase||!firebase.auth||!firebase.auth().currentUser)return Promise.reject(new Error('Нет подтверждённой Admin-сессии'));
    return firebase.auth().currentUser.getIdToken().then(function(token){
      var controller=typeof AbortController==='function'?new AbortController():null;
      var timer=controller?setTimeout(function(){controller.abort();},12000):null;
      return fetch(window.AUTH_SERVER+path,{
        method:method,
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:body?JSON.stringify(body):undefined,
        signal:controller?controller.signal:undefined,
        cache:'no-store'
      }).then(function(response){
        if(timer)clearTimeout(timer);
        return response.json().catch(function(){return {};}).then(function(data){
          if(!response.ok)throw new Error((data&&data.error)||('HTTP '+response.status));
          return data;
        });
      }).catch(function(error){if(timer)clearTimeout(timer);throw error;});
    });
  }
  function safeGet(path,fallback){
    return apiRequest('GET',path).catch(function(error){return {ok:false,error:error.message,fallback:fallback};});
  }
  function renderManifest(){
    var m=state.manifest;
    if(!m){el('pc-manifest').innerHTML='<div class="pc-empty">Манифест не получен</div>';return;}
    var flags=Object.keys(m.flags||{}).map(function(key){return '<div class="pc-row"><span>'+escapeHtml(key)+'</span>'+statusPill(Boolean(m.flags[key]),'включён','выключен')+'</div>';}).join('');
    var vars=Object.keys(m.variables||{}).map(function(key){return '<div class="pc-row"><span>'+escapeHtml(key)+'</span>'+statusPill(Boolean(m.variables[key]),'настроена','не настроена')+'</div>';}).join('');
    var blockers=(m.blockers||[]).map(function(item){return '<li>'+escapeHtml(BLOCKER_LABELS[item]||item)+'</li>';}).join('');
    el('pc-manifest').innerHTML=
      '<div class="pc-summary-grid">'+
        '<div class="pc-stat"><b>'+escapeHtml(m.revision||'—')+'</b><span>Версия</span></div>'+
        '<div class="pc-stat"><b>'+escapeHtml(m.workerMode||'—')+'</b><span>Режим worker</span></div>'+
        '<div class="pc-stat"><b>'+escapeHtml(m.environment||'—')+'</b><span>Окружение</span></div>'+
        '<div class="pc-stat"><b>'+(m.valid?'ГОТОВ':'БЛОКЕР')+'</b><span>Манифест</span></div>'+
      '</div>'+
      ((m.blockers||[]).length?'<div class="pc-alert bad"><b>Блокеры манифеста</b><ul>'+blockers+'</ul></div>':'<div class="pc-alert ok">Манифест валиден. Это ещё не означает готовность к отправке.</div>')+
      '<details class="pc-details"><summary>Переменные окружения</summary>'+vars+'</details>'+
      '<details class="pc-details"><summary>Флаги controlled activation</summary>'+flags+'</details>';
  }
  function renderPreflight(){
    var p=state.preflight;
    if(!p){el('pc-preflight').innerHTML='<div class="pc-empty">Preflight не получен</div>';return;}
    var checks=(p.checks||[]).map(function(check){
      return '<div class="pc-check '+(check.passed?'ok':'bad')+'"><span>'+(check.passed?'✅':'⛔')+'</span><div><b>'+escapeHtml(CHECK_LABELS[check.id]||check.id)+'</b><small>'+escapeHtml(check.description||'')+'</small></div></div>';
    }).join('');
    var blockers=(p.blockers||[]).map(function(item){return '<li>'+escapeHtml(BLOCKER_LABELS[item]||item)+'</li>';}).join('');
    el('pc-preflight').innerHTML=
      '<div class="pc-status-line">'+statusPill(Boolean(p.ready),'готов к одному тесту','не готов к отправке')+'<span>Проверено: '+escapeHtml(fmtTime(p.checkedAt))+'</span></div>'+
      (p.ready?'<div class="pc-alert warn">Preflight готов, но запуск выполняется только по отдельному ручному подтверждению.</div>':'<div class="pc-alert bad"><b>Что блокирует тест</b><ul>'+blockers+'</ul></div>')+
      '<div class="pc-checks">'+checks+'</div>';
    var testButton=el('pc-test-locked');
    if(testButton){
      testButton.disabled=true;
      testButton.textContent=p.ready?'Одиночный тест требует ручного подтверждения':'Одиночный тест заблокирован preflight';
    }
  }
  function recordCard(item,type){
    var summary=item.summary||{};
    var progress=type==='run'?(summary.progressPercent||0):((summary.passedChecks||0)+'/'+(summary.totalChecks||0));
    return '<div class="pc-record"><div><b>'+escapeHtml(item.title||item.id||'Запись')+'</b><small>'+escapeHtml(item.status||'')+' · '+escapeHtml(fmtTime(item.createdAt))+'</small></div><span class="pc-pill neutral">'+escapeHtml(String(progress))+(type==='run'?'%':'')+'</span></div>';
  }
  function renderRecords(){
    var handoffs=state.handoffs.length?state.handoffs.slice(0,3).map(function(item){return recordCard(item,'handoff');}).join(''):'<div class="pc-empty">Handoff-записей пока нет</div>';
    var runs=state.runs.length?state.runs.slice(0,3).map(function(item){return recordCard(item,'run');}).join(''):'<div class="pc-empty">Evidence run пока нет</div>';
    el('pc-handoffs').innerHTML=handoffs;
    el('pc-runs').innerHTML=runs;
  }
  function renderAll(){renderManifest();renderPreflight();renderRecords();}

  function loadControl(){
    var loading=el('pc-loading');
    if(loading)loading.style.display='flex';
    var refresh=el('pc-refresh');
    if(refresh)refresh.disabled=true;
    return Promise.all([
      safeGet('/admin/v1/parser-deployment/manifest',null),
      safeGet('/admin/v1/parser-controlled-activation/preflight',null),
      safeGet('/admin/v1/parser-deployment/handoffs?limit=10',[]),
      safeGet('/admin/v1/parser-controlled-activation/runs?limit=10',[])
    ]).then(function(results){
      state.manifest=results[0]&&results[0].manifest||null;
      state.preflight=results[1]&&results[1].preflight||null;
      state.handoffs=results[2]&&results[2].items||[];
      state.runs=results[3]&&results[3].items||[];
      renderAll();
      var create=el('pc-create-checkpoint');
      if(create)create.disabled=!(state.manifest&&state.manifest.valid===true);
      var errors=results.filter(function(result){return result&&result.ok===false;}).map(function(result){return result.error;});
      if(errors.length)notify('Часть данных не загружена: '+errors.join('; '));
    }).catch(function(error){
      notify(error.message||'Не удалось загрузить статус');
    }).finally(function(){
      if(loading)loading.style.display='none';
      if(refresh)refresh.disabled=false;
    });
  }

  function createCheckpoint(){
    if(!state.manifest||state.manifest.valid!==true){notify('Сначала устраните блокеры манифеста');return;}
    if(!window.confirm('Создать безопасные служебные записи handoff и evidence run? Это не включает парсер и не отправляет сообщения.'))return;
    var button=el('pc-create-checkpoint');
    if(button)button.disabled=true;
    apiRequest('POST','/admin/v1/parser-controlled-activation/runs',{
      title:'Controlled parser activation evidence',environment:state.manifest.environment||'production',destinationAlias:'controlled_destination',operatorAlias:'super_admin'
    }).then(function(runResponse){
      var run=runResponse.item||{};
      return apiRequest('POST','/admin/v1/parser-deployment/handoffs',{
        title:'Parser controlled deployment handoff',evidenceRunId:run.id||''
      });
    }).then(function(){
      notify('Контрольные записи созданы. Telegram-отправка не включалась.');
      return loadControl();
    }).catch(function(error){
      notify(error.message||'Не удалось создать контрольные записи');
    }).finally(function(){if(button)button.disabled=false;});
  }

  window.openParserProductionControl=function(){
    if(typeof window.switchTab==='function')window.switchTab('parser-production');
    loadControl();
  };
  window.loadParserProductionControl=loadControl;

  document.addEventListener('click',function(event){
    var target=event.target;
    if(!target)return;
    if(target.id==='pc-refresh')loadControl();
    if(target.id==='pc-create-checkpoint')createCheckpoint();
  });
})();
