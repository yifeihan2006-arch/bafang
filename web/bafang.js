'use strict';

const items = menuData;
const pages = {
  menu: ['点菜', 'Food Menu'], drinks: ['饮品', 'Drinks'],
  tea: ['以茶入席', 'Tea Pairings'], wine: ['以酒入席', 'Alcohol Pairings'],
  passport: ['集章', 'Taste Passport'], reserve: ['预订', 'Reservations'],
};
const groups = {
  menu: [['开席','Small Plates & Starters'],['田园','Vegetables'],['山海','Seafood'],
    ['五谷','Rice, Noodles & Dim Sum'],['炙火','Meat & Grill'],['余味','Desserts']],
  drinks: [['清饮','Tea, Coffee & Non-Alcoholic'],['夜酌','Cocktails & Spirits']],
};
const cuisines = [
  ['浙','浙江','Zhejiang','龙井虾仁','龙井绿茶','Longjing Green Tea','龙井金汤力'],
  ['粤','广东','Cantonese','豉油清蒸时鱼','陈皮普洱','Aged Mandarin Peel Pu’er','陈皮威士忌酸'],
  ['鲁','山东','Shandong','葱烧海参','冷泡白茶','Cold-brew White Tea','梨香白酒柯林斯'],
  ['苏','江苏','Jiangsu','桂花糖醋小排','碧螺春','Biluochun Tea','桂花黄酒鸡尾酒'],
  ['闽','福建','Fujian','红糟蒸海鲈','武夷岩茶','Wuyi Rock Tea','乌龙嗨棒'],
  ['徽','安徽','Anhui','徽州刀板香','祁门红茶','Keemun Black Tea','祁门红茶古典'],
  ['川','四川','Sichuan','藤椒脆皮鸡','茉莉花茶','Jasmine Tea','青花椒嗨棒'],
  ['湘','湖南','Hunan','小炒黄牛肉','冷泡乌龙','Cold-brew Oolong','辣梅酸'],
];
const slots = ['11:30','12:00','12:30','13:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30'];
const stampKey = 'bafang-passport-v1';
const orderKey = 'bafang-order-v1';
const $ = id => document.getElementById(id);
const content = $('content');
const dialog = $('dialog');
const dialogContent = $('dialog-content');
const escape = value => String(value).replace(/[&<>"']/g, ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[ch]);
const bilingual = (zh, en) => escape(zh) + '<small lang="en">' + escape(en) + '</small>';
const copy = (zh, en) => '<p class="copy">' + bilingual(zh, en) + '</p>';

function load(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const stamps = new Set(load(stampKey).filter(seal => cuisines.some(([code]) => code === seal)));
const order = new Map(load(orderKey).filter(entry => Array.isArray(entry)
  && Number.isInteger(entry[0]) && items[entry[0]]
  && Number.isInteger(entry[1]) && entry[1] > 0 && entry[1] <= 99));
let route = '';
let category = '';
let region = '';
let reservation;

function action(name, item, zh, en, css = 'primary') {
  return '<button type="button" class="' + css + '" data-action="' + name + '" data-item="' + item
    + '" aria-label="' + escape(zh + ' ' + en + ' ' + items[item].name) + '">'
    + bilingual(zh, en) + '</button>';
}

function updateOrder() {
  const count = [...order.values()].reduce((sum, qty) => sum + qty, 0);
  $('order-count').textContent = count;
  $('order-button').hidden = !count && !['menu','drinks','tea','wine'].includes(route);
  $('order-button').setAttribute('aria-label', '点单清单 ' + count + ' 项 / Order list, ' + count + ' items');
}
function adjust(index, delta) {
  if (!items[index]) return;
  const quantity = Math.min(99, Math.max(0, (order.get(index) || 0) + delta));
  if (quantity) order.set(index, quantity);
  else order.delete(index);
  save(orderKey, [...order]);
  updateOrder();
  $('status').textContent = items[index].name + ' × ' + quantity + '。点单清单已更新 / Order updated';
}

function showDialog(title, body) {
  $('dialog-title').innerHTML = title;
  dialogContent.innerHTML = body;
  if (!dialog.open) dialog.showModal();
}
function showOrder(index, buttonAction) {
  let total = 0;
  const lines = [...order].map(([id, quantity]) => {
    const item = items[id];
    const subtotal = quantity * item.price;
    total += subtotal;
    return '<div class="order-line"><div>' + bilingual(item.name, item.en)
      + '<strong class="price">¥' + subtotal + '</strong></div><div>'
      + '<button type="button" data-action="minus" data-item="' + id + '" aria-label="减少 / Remove one '
      + escape(item.name) + '">−</button><span>' + quantity + '</span>'
      + '<button type="button" data-action="plus" data-item="' + id + '" aria-label="增加 / Add one '
      + escape(item.name) + '">+</button></div></div>';
  });
  showDialog(bilingual('点单清单', 'Order List'),
    copy('此清单仅供演示，可向服务员出示。', 'This demo list can be shown to your server.')
    + (lines.join('') || '<p>' + bilingual('清单还是空的。', 'Your list is empty.') + '</p>')
    + '<p>' + bilingual('合计', 'Total') + '<strong class="price">¥' + total + '</strong></p>');
  if (buttonAction) {
    (dialogContent.querySelector('[data-item="' + index + '"][data-action="' + buttonAction + '"]')
      || dialogContent.querySelector('button') || $('close')).focus();
  }
}

function photo(item, lazy = true) {
  return '<img class="photo" src="' + escape(item.image) + '" alt=""'
    + (lazy ? ' loading="lazy" decoding="async"' : '') + '>';
}
function showItem(id) {
  const item = items[id];
  if (!item) return;
  showDialog(bilingual(item.name, item.en), photo(item, false)
    + '<p>' + bilingual(item.flavour, item.flavourEn) + '</p>'
    + '<p><strong class="price">¥' + item.price + '</strong></p>'
    + action('add', id, '加入清单', 'Add to order'));
}
function renderMenu() {
  const options = [['','All'], ...groups[route]];
  const filters = options.map(([zh,en]) =>
    '<button type="button" class="filter" data-action="filter" data-category="' + zh
    + '" aria-pressed="' + (category === zh && !region) + '">' + bilingual(zh || '全部', en) + '</button>').join('');
  const allowed = groups[route].map(([name]) => name);
  const cards = items.map((item, id) => ({item,id})).filter(({item}) =>
    allowed.includes(item.category) && (!category || item.category === category) && (!region || item.seal === region)
  ).map(({item,id}) =>
    '<article class="card">' + photo(item) + '<div class="item"><h2>' + bilingual(item.name, item.en) + '</h2>'
    + action('detail', id, '查看详情', 'Details', 'details')
    + '<div class="item-controls"><strong class="price">¥' + item.price + '</strong>'
    + action('add', id, '加入清单', 'Add') + '</div></div></article>').join('');
  content.innerHTML = '<div class="filters" aria-label="菜单分类 / Menu categories">' + filters + '</div>'
    + (route === 'drinks' ? copy('含酒精饮品仅供成年人。', 'Alcoholic drinks are for adults only.') : '')
    + '<div class="grid">' + cards + '</div>';
}

function renderPairings() {
  const tea = route === 'tea';
  const cards = cuisines.map(([, , , dishName, teaName, teaEn, cocktail]) => {
    const dish = items.find(item => item.name === dishName);
    const drinkName = tea ? teaName : cocktail;
    const id = items.findIndex(item => item.name === drinkName);
    const drink = items[id];
    if (!dish || (!tea && !drink)) return '';
    return '<article class="pair"><h2>' + bilingual(dish.name, dish.en) + '</h2><p>'
      + bilingual('搭配 ' + drinkName, 'Pair with ' + (drink?.en || teaEn)) + '</p>'
      + (drink ? action('add', id, '加入清单', tea ? 'Add tea' : 'Add drink') : '') + '</article>';
  });
  content.innerHTML = (tea
    ? copy('八道代表菜，各配一款茶。饮品菜单上有的茶可直接加入清单。', 'Eight dishes, each paired with a tea. Add any tea available on the drinks menu.')
    : copy('八道代表菜，各配一款中式特调。含酒精饮品仅供成年人。', 'Eight dishes, each paired with a Chinese-inspired cocktail. For adults only.'))
    + '<div class="grid pairs">' + cards.join('') + '</div>';
}
function updateStamps() {
  $('stamp-count').value = stamps.size + ' / 8';
  $('stamp-progress').value = stamps.size;
  content.querySelectorAll('[data-seal]').forEach(button => {
    const seal = button.dataset.seal;
    button.setAttribute('aria-pressed', stamps.has(seal));
    button.querySelector('b').textContent = seal + (stamps.has(seal) ? ' ✓' : '');
  });
}
function renderPassport() {
  content.innerHTML = copy('点一下记录尝过的菜系，再点一次取消。进度保存在当前设备。', 'Tap to stamp a cuisine you have tried. Tap again to undo. Progress is saved on this device.')
    + '<div class="stamp-meter"><output id="stamp-count"></output><progress id="stamp-progress" max="8" aria-label="集章进度 / Stamp progress"></progress></div>'
    + '<div class="stamps">' + cuisines.map(([seal,zh,en]) => '<button type="button" data-action="stamp" data-seal="'
      + seal + '"><b aria-hidden="true">' + seal + '</b>' + bilingual(zh,en) + '</button>').join('') + '</div>'
    + '<p id="stamp-status" role="status"></p>';
  updateStamps();
}

function restaurantDate(offset = 0) {
  return new Date(Date.now() + 28800000 + 86400000 * offset).toISOString().slice(0,10);
}
function renderReserve() {
  content.innerHTML = copy('选择日期、时间和人数，生成预订意向单。此功能为演示，餐厅暂未开放线上订位。',
    'Choose a date, time and party size to create a demo reservation request. Online bookings are not open yet.')
    + '<form id="reservation"><label><span>' + bilingual('用餐日期', 'Date')
    + '</span><input type="date" name="date" min="' + restaurantDate() + '" value="'
    + (reservation?.date || restaurantDate(1)) + '" required></label><label><span>'
    + bilingual('到店时间（北京时间）', 'Time (China Standard Time)') + '</span><select name="time">'
    + slots.map(time => '<option' + (time === (reservation?.time || '18:30') ? ' selected' : '') + '>' + time + '</option>').join('')
    + '</select></label><label><span>' + bilingual('用餐人数', 'Guests') + '</span><select name="guests">'
    + Array.from({length:12}, (_,i) => '<option' + (i + 1 === (reservation?.guests || 2) ? ' selected' : '') + '>' + (i + 1) + '</option>').join('')
    + '</select></label><p id="reserve-error" role="alert"></p><button class="primary" type="submit">'
    + bilingual('生成预订意向单', 'Create Reservation Request') + '</button></form>';
}
function reserve(event) {
  event.preventDefault();
  const fields = new FormData(event.target);
  const date = String(fields.get('date'));
  const time = String(fields.get('time'));
  const guests = Number(fields.get('guests'));
  const timestamp = Date.parse(date + 'T' + time + ':00+08:00');
  if (!Number.isFinite(timestamp) || timestamp <= Date.now() || !slots.includes(time)
      || !Number.isInteger(guests) || guests < 1 || guests > 12) {
    $('reserve-error').innerHTML = bilingual('请选择未来的用餐日期和时间，并确认人数。', 'Choose a future date and time and confirm your party size.');
    return;
  }
  $('reserve-error').textContent = '';
  reservation = {date, time, guests};
  showDialog(bilingual('预订意向单已生成', 'Reservation Request Created'),
    copy('此意向单仅供演示，尚未发送至餐厅。', 'This demo request has not been sent to the restaurant.')
    + '<p>' + escape(date) + ' · ' + escape(time) + ' (UTC+8) · ' + guests + ' 位 / Guests</p>'
    + '<button class="primary" type="button" data-action="download">' + bilingual('下载意向单', 'Download Request') + '</button>');
}
function downloadRequest() {
  if (!reservation) return;
  const {date,time,guests} = reservation;
  const body = ['日膳夜酌 · 八方有味', '预订意向单 / Demo Reservation Request', '',
    '日期 / Date: ' + date, '时间 / Time: ' + time + ' (UTC+8)', '人数 / Guests: ' + guests, '',
    '此意向单仅供演示，尚未发送至餐厅。', 'This demo request has not been sent to the restaurant.'].join('\n');
  const url = URL.createObjectURL(new Blob([body], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = '八方有味-预订意向-' + date + '.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderRoute(focus = false) {
  const name = location.hash.slice(1);
  const previous = route;
  route = Object.prototype.hasOwnProperty.call(pages, name) ? name : '';
  $('home').hidden = Boolean(route);
  $('feature').hidden = !route;
  updateOrder();
  if (!route) {
    document.title = '日膳夜酌 · 八方有味 | Ba Fang';
    if (focus && previous) $('home').querySelector('a[href="#' + previous + '"]').focus();
    return;
  }
  $('title').innerHTML = bilingual(...pages[route]);
  document.title = pages[route][0] + ' | 日膳夜酌 · 八方有味';
  if (route === 'menu' || route === 'drinks') {
    const query = new URLSearchParams(location.search);
    const legacyCategories = {starters:'开席',vegetables:'田园',seafood:'山海',grains:'五谷',
      grill:'炙火',desserts:'余味',soft:'清饮',cocktails:'夜酌'};
    const requested = legacyCategories[query.get('category')];
    category = groups[route].some(([name]) => name === requested) ? requested : '';
    region = route === 'menu' && cuisines.some(([seal]) => seal === query.get('region')) ? query.get('region') : '';
    renderMenu();
  }
  if (route === 'tea' || route === 'wine') renderPairings();
  if (route === 'passport') renderPassport();
  if (route === 'reserve') renderReserve();
  if (focus) {
    window.scrollTo(0,0);
    $('title').focus({preventScroll:true});
  }
}

$('close').addEventListener('click', () => dialog.close());
$('order-button').addEventListener('click', () => showOrder());
window.addEventListener('hashchange', () => renderRoute(true));
content.addEventListener('submit', event => {
  if (event.target.id === 'reservation') reserve(event);
});
document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const name = button.dataset.action;
  const id = Number(button.dataset.item);
  if (name === 'filter') {
    category = button.dataset.category;
    region = '';
    renderMenu();
    content.querySelector('.filter[aria-pressed="true"]').focus();
  }
  if (name === 'detail') showItem(id);
  if (name === 'add') {
    adjust(id, 1);
    button.innerHTML = bilingual('已加入 · ' + order.get(id), 'Added');
  }
  if (name === 'plus' || name === 'minus') {
    adjust(id, name === 'plus' ? 1 : -1);
    showOrder(id, name);
  }
  if (name === 'stamp') {
    const seal = button.dataset.seal;
    if (stamps.has(seal)) stamps.delete(seal);
    else stamps.add(seal);
    $('stamp-status').innerHTML = save(stampKey, [...stamps])
      ? '' : bilingual('当前浏览器暂时无法保存。', 'This browser could not save your stamps.');
    updateStamps();
  }
  if (name === 'download') downloadRequest();
});
renderRoute();
