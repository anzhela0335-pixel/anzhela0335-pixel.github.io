/* МАРТдекор — прототип: вывод карточек, поиск, фильтры, «открыто сейчас». */
(function () {
  'use strict';
  var T = window.typo || function (s) { return s; };

  function fmt(n) { return 'от ' + n.toLocaleString('ru-RU') + ' ₽'; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function sectionName(id) {
    var s = SECTIONS.find(function (x) { return x.id === id; });
    return s ? s.name : id;
  }

  /* — карточка товара — */
  function productCard(p) {
    var badge = p.status === 'few'
      ? '<span class="badge few">Количество ограничено</span>'
      : '<span class="badge in">В наличии</span>';
    return '<a class="card product reveal" href="item.html?id=' + p.id + '">' +
      '<span class="ring"></span>' +
      '<div class="ph">Фото — заглушка.<br>Нужен кадр: ' + esc(T(p.name)) + '</div>' +
      '<span class="count">' + esc(sectionName(p.section)) + '</span>' +
      '<h3>' + esc(T(p.name)) + '</h3>' +
      '<div class="short">' + esc(T(p.short)) + '</div>' +
      '<div class="row"><span class="price">' + fmt(p.price) + '</span>' + badge + '</div>' +
      '<span class="src">Источник: ' + esc(p.source) + '</span></a>';
  }

  /* — главная — */
  function renderHome() {
    var el;

    el = document.getElementById('sectionsGrid');
    if (el) {
      el.innerHTML = SECTIONS.map(function (s) {
        return '<a class="card reveal" href="catalog.html?section=' + s.id + '">' +
          '<span class="ring"></span>' +
          '<span class="count">' + esc(s.count) + '</span>' +
          '<h3>' + esc(T(s.name)) + '</h3>' +
          '<div class="price">' + fmt(s.from) + '</div>' +
          '<div class="fact">' + esc(T(s.fact)) + '</div></a>';
      }).join('');
    }

    el = document.getElementById('featuredGrid');
    if (el) {
      var picks = ['shpon-1', 'freski-1', 'panel-1', 'kraska-1', 'oboi-1', 'bambuk-1'];
      el.innerHTML = PRODUCTS.filter(function (p) { return picks.indexOf(p.id) >= 0; })
        .map(productCard).join('');
    }

    el = document.getElementById('articlesGrid');
    if (el) {
      el.innerHTML = ARTICLES.map(function (a) {
        return '<a class="card article-card reveal" href="article.html?id=' + a.id + '">' +
          '<span class="tag">' + esc(T(a.tag)) + '</span>' +
          '<h3>' + esc(T(a.title)) + '</h3>' +
          '<p>' + esc(T(a.lead)) + '</p>' +
          '<span class="src">Источник: ' + esc(a.source) + '</span></a>';
      }).join('');
    }

    el = document.getElementById('reviewsGrid');
    if (el) {
      var y = REVIEWS.yandex;
      var html = '<div class="review review-rating reveal"><strong class="rating-num">' + esc(y.rating) + '</strong>' +
        '<p>' + esc(T(y.text)) + '</p>' +
        '<span class="src">Источник: ' + esc(y.source) + '</span></div>';
      html += REVIEWS.items.map(function (r) {
        return '<div class="review reveal"><p>«' + esc(T(r.text)) + '»</p>' +
          '<div class="who">' + esc(r.who) + ', ' + esc(T(r.role)) + '</div>' +
          '<span class="src">Источник: ' + esc(r.source) + '</span></div>';
      }).join('');
      el.innerHTML = html;
    }

    el = document.getElementById('stepsGrid');
    if (el) {
      el.innerHTML = STEPS.map(function (s) {
        return '<li class="step reveal"><span class="step-n">' + esc(s.n) + '</span>' +
          '<h3>' + esc(T(s.title)) + '</h3><p>' + esc(T(s.text)) + '</p></li>';
      }).join('');
    }

    el = document.getElementById('stylesGrid');
    if (el) {
      el.innerHTML = STYLES.map(function (s) {
        return '<div class="card style-card reveal"><h3>' + esc(T(s.name)) + '</h3>' +
          '<p>' + esc(T(s.desc)) + '</p>' +
          '<div class="picks">' + esc(T(s.picks)) + '</div>' +
          '<a class="btn btn-line" href="catalog.html">Смотреть в каталоге</a></div>';
      }).join('');
    }

    el = document.getElementById('faqList');
    if (el) {
      el.innerHTML = FAQ.map(function (f) {
        return '<details><summary>' + esc(T(f.q)) + '</summary><p>' + esc(T(f.a)) + '</p></details>';
      }).join('');
    }
  }

  /* — каталог — */
  var catState = { q: '', section: 'all', max: 0, stock: false };

  function renderCatalog() {
    var grid = document.getElementById('catalog-grid');
    if (!grid) return;

    var chips = document.getElementById('chips');
    chips.innerHTML = [{ id: 'all', name: 'Все разделы' }].concat(SECTIONS).map(function (s) {
      return '<button class="chip' + (catState.section === s.id ? ' on' : '') +
        '" data-s="' + s.id + '">' + esc(T(s.name)) + '</button>';
    }).join('');
    chips.querySelectorAll('.chip').forEach(function (c) {
      c.onclick = function () {
        catState.section = c.dataset.s;
        renderCatalog();
      };
    });

    var list = PRODUCTS.filter(function (p) {
      if (catState.section !== 'all' && p.section !== catState.section) return false;
      if (catState.q && p.name.toLowerCase().indexOf(catState.q.toLowerCase()) < 0) return false;
      if (catState.max && p.price > catState.max) return false;
      if (catState.stock && p.status !== 'in') return false;
      return true;
    });

    grid.innerHTML = list.length
      ? list.map(productCard).join('')
      : '<p class="note-demo">По вашему запросу ничего не найдено — попробуйте изменить фильтры.</p>';
    document.getElementById('found').textContent =
      'Позиции выборки: показано ' + list.length + ' из ' + PRODUCTS.length;
    revealScan();
  }

  function initCatalog() {
    if (!document.getElementById('catalog-grid')) return;
    var q = new URLSearchParams(location.search).get('section');
    if (q) catState.section = q;
    var search = document.getElementById('f-search');
    var max = document.getElementById('f-max');
    var stock = document.getElementById('f-stock');
    if (search) search.oninput = function () { catState.q = search.value; renderCatalog(); };
    if (max) max.onchange = function () { catState.max = +max.value || 0; renderCatalog(); };
    if (stock) stock.onchange = function () { catState.stock = stock.checked; renderCatalog(); };
    renderCatalog();
  }

  /* — карточка товара — */
  function renderItem() {
    var box = document.getElementById('item');
    if (!box) return;
    var id = new URLSearchParams(location.search).get('id');
    var p = PRODUCTS.find(function (x) { return x.id === id; }) || PRODUCTS[0];

    var specs = p.specs.map(function (s) {
      return '<tr><td>' + esc(T(s[0])) + '</td><td>' + esc(T(s[1])) + '</td></tr>';
    }).join('');
    var pros = p.pros.length
      ? '<h3>Плюсы</h3><ul class="pros">' + p.pros.map(function (x) {
          return '<li>' + esc(T(x)) + '</li>'; }).join('') + '</ul>'
      : '';
    var need = p.need
      ? '<div class="need" style="margin-top:18px"><b>Нужно от вас:</b> ' + esc(T(p.need)) + '.</div>'
      : '';
    var badge = p.status === 'few'
      ? '<span class="badge few">Количество ограничено</span>'
      : '<span class="badge in">В наличии</span>';

    box.innerHTML =
      '<div class="crumbs"><a href="catalog.html">Каталог</a> → ' + esc(sectionName(p.section)) + '</div>' +
      '<div class="item-layout">' +
        '<div><div class="ph">Фото — заглушка.<br>Нужен кадр: ' + esc(T(p.name)) + '</div></div>' +
        '<div>' +
          '<span class="count">' + esc(sectionName(p.section)) + '</span>' +
          '<h1 style="font-family:var(--font-display);font-size:30px;margin:6px 0 10px">' + esc(T(p.name)) + '</h1>' +
          '<p style="color:var(--muted)">' + esc(T(p.short)) + '</p>' +
          '<div class="row" style="display:flex;justify-content:space-between;align-items:center;margin:18px 0">' +
            '<span class="price" style="font-size:26px;font-weight:700;color:var(--accent)">' + fmt(p.price) + '</span>' + badge + '</div>' +
          '<table class="specs">' + specs + '</table>' +
          pros + need +
          '<div class="request-form">' +
            '<h3>Оставить заявку</h3>' +
            '<p>Менеджер уточнит наличие, согласует состав заказа и выставит счёт. Оплата на сайте не производится.</p>' +
            '<form id="req">' +
              '<input type="text" name="name" placeholder="Ваше имя" required>' +
              '<input type="tel" name="phone" placeholder="Телефон" required>' +
              '<button class="btn btn-accent" type="submit">Отправить заявку</button>' +
            '</form>' +
            '<div class="request-ok" id="req-ok">Заявка записана (демо). В рабочей версии она уйдёт менеджеру.</div>' +
          '</div>' +
          '<span class="src">Источник данных: ' + esc(p.source) + '</span>' +
        '</div>' +
      '</div>';

    document.getElementById('req').onsubmit = function (e) {
      e.preventDefault();
      document.getElementById('req-ok').style.display = 'block';
    };
  }

  /* — статья — */
  function renderArticle() {
    var box = document.getElementById('article');
    if (!box) return;
    var id = new URLSearchParams(location.search).get('id');
    var a = ARTICLES.find(function (x) { return x.id === id; }) || ARTICLES[0];
    box.innerHTML =
      '<div class="crumbs"><a href="index.html#articles">Советы</a> → ' + esc(T(a.tag)) + '</div>' +
      '<div class="article-body">' +
        '<span class="tag">' + esc(T(a.tag)) + '</span>' +
        '<h1 style="font-family:var(--font-display);font-size:34px;margin:10px 0 14px">' + esc(T(a.title)) + '</h1>' +
        '<p class="lead">' + esc(T(a.lead)) + '</p>' +
        a.body.map(function (p) { return '<p>' + esc(T(p)) + '</p>'; }).join('') +
        '<p class="src" style="color:var(--muted);font-size:14px">Источник: ' + esc(a.source) + '</p>' +
      '</div>';
  }

  /* — «открыто сейчас» — */
  function openNow() {
    var el = document.getElementById('open-now');
    if (!el) return;
    var d = new Date();
    var day = d.getDay(); // 0 — вс
    var h = d.getHours() + d.getMinutes() / 60;
    var rng = (day === 0 || day === 6) ? FACTS.hours.weekend : FACTS.hours.work;
    var open = h >= rng[0] && h < rng[1];
    el.className = 'open-now ' + (open ? 'yes' : 'no');
    el.textContent = open
      ? 'Сейчас открыто — до ' + rng[1] + ':00'
      : 'Сейчас закрыто — ' + FACTS.hoursText;
  }

  /* — появление при прокрутке — */
  function revealScan() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
      });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal:not(.shown)').forEach(function (el) { io.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHome();
    initCatalog();
    renderItem();
    renderArticle();
    openNow();
    revealScan();
  });
})();
