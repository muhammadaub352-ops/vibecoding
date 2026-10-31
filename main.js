(function () {
  // нельзя показывать сайт внутри чужой страницы
  if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.style.display = 'none'; } }
  document.documentElement.classList.add('js');
  // шапка с линией при прокрутке
  var top = document.getElementById('top');
  addEventListener('scroll', function () { top.classList.toggle('scrolled', scrollY > 10); }, { passive: true });

  // плавное появление блоков
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // ===== цены по датам (время московское) =====
  var SALES_OPEN = new Date('2026-10-28T00:00:00+03:00');
  var PERIODS = [
    { until: new Date('2026-10-30T00:00:00+03:00'), start: 12900, profi: 27900, vip: 59900, next: { start: 15900, profi: 29900, vip: 63900 } },
    { until: new Date('2026-11-20T00:00:00+03:00'), start: 15900, profi: 29900, vip: 63900, next: { start: 27900, profi: 39900, vip: 79900 } },
    { until: null, start: 27900, profi: 39900, vip: 79900, next: null }
  ];
  var OLD = { start: 27900, profi: 39900, vip: 79900 };
  function rub(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function period(now) { for (var i = 0; i < PERIODS.length; i++) if (!PERIODS[i].until || now < PERIODS[i].until) return PERIODS[i]; }
  var cur = period(new Date());
  function render() {
    var now = new Date(), p = cur = period(now);
    document.querySelectorAll('[data-price]').forEach(function (box) {
      var k = box.getAttribute('data-price'), c = p[k], old = OLD[k];
      var off = Math.round((1 - c / old) * 100);
      box.innerHTML =
        (off > 0 ? '<div class="pr-old"><s>' + rub(old) + ' ₽</s><span class="pr-off">−' + off + '%</span></div>' : '') +
        '<div class="price">' + rub(c) + ' <small>₽</small></div>' +
        (p.next ? '<div class="pr-next">↑ Следующая цена — ' + rub(p.next[k]) + ' ₽</div>' : '');
    });
    document.querySelectorAll('[data-from]').forEach(function (el) { el.textContent = rub(p.start); });
    // строка над кнопками и таймер
    var text = document.getElementById('saleText'), timer = document.getElementById('saleTimer'), target;
    if (now < SALES_OPEN) { text.textContent = 'Продажи открываются 28 октября'; target = null; }
    else if (p.until) { text.textContent = 'Цена вырастет через'; target = p.until; }
    else { text.textContent = 'Старт обучения — 10 ноября'; target = null; }
    if (target) {
      var ms = target - now, d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      timer.textContent = (d ? d + ' дн ' : '') + h + ' ч ' + m + ' мин';
    } else timer.textContent = '';
  }
  render(); setInterval(render, 30000);

  // ===== тест «какой тариф подойдёт» =====
  var QS = [
    { t: 'Зачем тебе вайбкодинг?', o: [['Попробовать и сделать свой первый сайт', 0], ['Делать сайты и ботов на заказ и зарабатывать', 1], ['Запустить серьёзный проект или выйти на большие заказы', 2]] },
    { t: 'Сколько времени готов уделять?', o: [['2–3 часа в неделю', 0], ['5–7 часов в неделю', 1], ['Сколько нужно — хочу результат быстрее', 2]] },
    { t: 'Нужна ли личная помощь спикера?', o: [['Нет, разберусь по урокам', 0], ['Хватит проверки заданий и пары созвонов', 1], ['Да, хочу вести проект вместе с Аюбом', 2]] }
  ];
  var PLANS = [
    { k: 'start', n: 'Старт', w: 'Сделаешь свой первый сайт с телефона и поймёшь, как работать с ИИ.' },
    { k: 'profi', n: 'Профи', w: 'Научишься делать сайты и ботов для бизнеса, соберёшь портфолио и узнаешь, где искать клиентов.' },
    { k: 'vip', n: 'VIP', w: 'Будешь работать лично с Аюбом и Мансуром и сделаешь свой реальный проект вместе со спикером.' }
  ];
  var qi = 0, score = [0, 0, 0];
  var qStep = document.getElementById('qStep'), qTitle = document.getElementById('qTitle'), qOpts = document.getElementById('qOpts'),
      qBar = document.getElementById('qBar'), qAsk = document.getElementById('qAsk'), qRes = document.getElementById('qRes');
  function ask() {
    var q = QS[qi];
    qStep.textContent = 'Вопрос ' + (qi + 1) + ' из ' + QS.length;
    qTitle.textContent = q.t;
    qBar.style.width = ((qi + 1) / QS.length * 100) + '%';
    qOpts.innerHTML = '';
    q.o.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'q-opt'; b.innerHTML = '<i aria-hidden="true"></i>';
      b.appendChild(document.createTextNode(o[0]));
      b.addEventListener('click', function () { score[o[1]]++; qi++; qi < QS.length ? ask() : result(); });
      qOpts.appendChild(b);
    });
  }
  function result() {
    var best = 1;
    if (score[2] > score[best]) best = 2;
    if (score[0] > score[best]) best = 0;
    var p = PLANS[best];
    document.getElementById('qName').textContent = '«' + p.n + '» — ' + rub(cur[p.k]) + ' ₽';
    document.getElementById('qWhy').textContent = p.w;
    document.getElementById('qGo').href = 'https://t.me/vibecoding_edu_bot?start=quiz_' + p.k;
    qAsk.style.display = 'none'; qRes.classList.add('on');
  }
  document.getElementById('qAgain').addEventListener('click', function () {
    qi = 0; score = [0, 0, 0]; qRes.classList.remove('on'); qAsk.style.display = ''; ask();
  });
  ask();

  // ===== просмотр чеков =====
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lastBtn;
  function closeLb() { lb.classList.remove('on'); document.body.classList.remove('lock'); lbImg.removeAttribute('src'); if (lastBtn) lastBtn.focus(); }
  document.querySelectorAll('[data-full]').forEach(function (b) {
    b.addEventListener('click', function () {
      lastBtn = b; lbImg.src = b.querySelector('img').src;
      lb.classList.add('on'); document.body.classList.add('lock'); document.getElementById('lbX').focus();
    });
  });
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('on')) closeLb(); });
})();

// нижняя кнопка на телефоне: прячем на первом экране, у тарифов и в конце
(function () {
  var bar = document.getElementById('mbar'); if (!bar) return;
  var hideAt = [document.getElementById('plans'), document.getElementById('contact')];
  function upd() {
    var hide = scrollY < innerHeight * 0.7 || hideAt.some(function (el) { var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    bar.classList.toggle('hide', hide);
  }
  addEventListener('scroll', upd, { passive: true }); upd();
})();
