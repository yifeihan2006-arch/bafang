'use strict';

const items = menuData;
const pages = {
  menu: ['八方食志', 'À la Carte', 'THE FOOD MENU'], drinks: ['杯中八方', 'Tea & Cocktails', 'THE DRINKS LIST'],
  tea: ['以茶入席', 'Tea Pairings', 'AT THE TABLE / 01'], wine: ['以酒入席', 'Cocktail Pairings', 'AT THE TABLE / 02'],
  passport: ['八方集章', 'Taste Passport', 'AT THE TABLE / 03'], reserve: ['订一席', 'Reservations', 'RESERVATIONS'],
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
const orderKey = 'bafang-order-v2';
const legacyOrderKey = 'bafang-order-v1';
// Index order used by the original six-entry site.
const legacyNames = [
  '陈皮冰梅番茄','龙井盐水毛豆','桂花糟香鸡','红糟海鲜小碟','葱油海蜇头','香煎毛豆腐','青花椒口水鸡','擂椒皮蛋茄子',
  '白灼时蔬','龙井春笋','鸡汁煮干丝','上汤时蔬','葱烧菌菇','干煸四季豆','擂椒茄子',
  '豉油清蒸时鱼','蟹粉豆腐','龙井虾仁','红糟蒸海鲈','葱烧海参','青花椒酸汤鱼','剁椒蒸鱼头',
  '阳春面','虾饺皇','片儿川','海鲜打卤面','沙茶海鲜面','腊味煲仔饭','笋干火腿焖饭','担担面','腊肉炒饭',
  '陈皮蜜汁叉烧','荔枝肉','桂花糖醋小排','藤椒脆皮鸡','徽州刀板香','梅干菜焖五花肉','葱烧牛肋条','小炒黄牛肉','椒麻炙烤牛小排',
  '红糖冰粉','龙井茶奶冻','陈皮红豆沙','桂花酒酿圆子','古早花生汤','黄山毛峰茶酥',
  '龙井绿茶','碧螺春','黄山毛峰','武夷岩茶','陈皮普洱','安化黑茶','桂花冷萃','龙井脏咖','陈皮拿铁','乌龙浓缩汤力','青花椒葡萄柚苏打',
  '桂花黄酒鸡尾酒','龙井金汤力','乌龙嗨棒','梨香白酒柯林斯','陈皮威士忌酸','祁门红茶古典','青花椒嗨棒','辣梅酸','八方',
];
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
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
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

const stamps = new Set((load(stampKey) || []).filter(seal => cuisines.some(([code]) => code === seal)));
const itemIds = new Map(items.map((item, id) => [item.name, id]));
const savedOrder = load(orderKey);
const order = new Map();
for (const entry of savedOrder ?? load(legacyOrderKey) ?? []) {
  if (!Array.isArray(entry)) continue;
  const [key, quantity] = entry;
  const name = savedOrder ? key : legacyNames[key];
  const id = itemIds.get(name);
  if (items[id] && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) {
    order.set(id, quantity);
  }
}
if (!savedOrder && order.size) persistOrder();

function persistOrder() {
  save(orderKey, [...order].map(([id, quantity]) => [items[id].name, quantity]));
}

let route = '';
let category = '';
let region = '';
let reservation;
let feedbackTimer;
let dialogTrigger;

function action(name, item, zh, en, css = 'primary', label = bilingual(zh, en)) {
  return '<button type="button" class="' + css + '" data-action="' + name + '" data-item="' + item
    + '" aria-label="' + escape(zh + ' ' + en + ' ' + items[item].name) + '">'
    + label + '</button>';
}


function orderTotals() {
  let count = 0;
  let total = 0;
  for (const [id, quantity] of order) {
    count += quantity;
    total += quantity * items[id].price;
  }
  return {count, total};
}

function updateOrder() {
  const {count, total} = orderTotals();
  $('order-count').textContent = count;
  $('order-total').textContent = '¥' + total;
  $('order-dock').hidden = !count && !['menu', 'drinks', 'tea', 'wine'].includes(route);
  $('order-button').setAttribute('aria-label', '本桌清单 ' + count + ' 项，合计 ¥' + total
    + ' / Table selection, ' + count + ' items');
  document.querySelectorAll('.quick-add').forEach(button => {
    const quantity = order.get(Number(button.dataset.item)) || 0;
    button.textContent = quantity || '+';
    button.classList.toggle('is-added', Boolean(quantity));
    button.disabled = quantity >= 99;
  });
}

function adjust(index, delta) {
  if (!items[index]) return;
  const quantity = Math.min(99, Math.max(0, (order.get(index) || 0) + delta));
  if (quantity) order.set(index, quantity);
  else order.delete(index);
  persistOrder();
  updateOrder();
  $('status').textContent = items[index].name + ' × ' + quantity + '。本桌清单已更新 / Table selection updated';
}

function showDialog(title, body) {
  $('dialog-title').innerHTML = title;
  dialogContent.innerHTML = body;
  if (!dialog.open) {
    dialogTrigger = document.activeElement;
    dialog.showModal();
  }
}

function showOrder(index, buttonAction) {
  const lines = [...order].map(([id, quantity]) => {
    const item = items[id];
    return '<div class="order-line"><div>' + bilingual(item.name, item.en) + '</div>'
      + '<strong class="price">¥' + (quantity * item.price) + '</strong><div class="stepper">'
      + action('minus', id, '减一份', 'Remove one', '', '−') + '<span>' + quantity + '</span>'
      + action('plus', id, '加一份', 'Add one', '', '+') + '</div></div>';
  });
  showDialog(bilingual('本桌清单', 'Table Selection'),
    copy('选好后，可将清单出示给服务员。', 'Show your selection to your server when ready.')
    + (lines.join('') || copy('还没有选菜。', 'Your selection is empty.'))
    + '<div class="order-summary"><span>' + bilingual('合计', 'Total') + '</span><strong class="price">¥'
    + orderTotals().total + '</strong></div>');
  if (buttonAction) {
    (dialogContent.querySelector('[data-item="' + index + '"][data-action="' + buttonAction + '"]')
      || dialogContent.querySelector('button') || $('close')).focus();
  }
}
function photo(item, lazy = true) {
  return '<img class="photo" src="' + escape(item.image) + '" alt=""'
    + (lazy ? ' loading="lazy" decoding="async"' : '') + '>';
}

const teasByPot = new Set(['龙井绿茶','碧螺春','黄山毛峰','武夷岩茶','陈皮普洱','安化黑茶']);
function itemPrice(item) {
  const unit = item.note === 'Per pot' || teasByPot.has(item.name)
    ? '<small lang="en">每壶 / Per pot</small>' : '';
  return '<span class="item-price"><strong class="price">¥' + item.price + '</strong>' + unit + '</span>';
}

function showItem(id) {
  const item = items[id];
  if (!item) return;
  showDialog('<span class="seal">' + escape(item.seal) + '</span>' + bilingual(item.name, item.en),
    photo(item, false) + '<p class="detail-copy">' + bilingual(item.flavour, item.flavourEn) + '</p>'
    + '<div class="detail-actions">' + itemPrice(item)
    + action('add', id, '加入本桌清单', 'Add to table selection', 'primary detail-add') + '</div>');
  dialogContent.querySelector('.detail-add').disabled = (order.get(id) || 0) >= 99;
}

function renderMenu() {
  const options = [['', 'All'], ...groups[route]];
  const filters = options.map(([zh, en]) =>
    '<button type="button" data-action="filter" data-category="' + zh
    + '" aria-pressed="' + (category === zh) + '">' + bilingual(zh || '全部', en) + '</button>').join('');
  const chapters = groups[route].map(([zh, en], chapter) => {
    if (category && zh !== category) return '';
    const rows = items.map((item, id) => ({item, id})).filter(({item}) =>
      item.category === zh && (!region || item.seal === region)
    ).map(({item, id}) =>
      '<li class="menu-entry">' + action('detail', id, '查看详情', 'Details', 'dish-open',
        photo(item) + '<span class="dish-title"><span class="seal">' + escape(item.seal) + '</span>'
        + bilingual(item.name, item.en) + '</span>')
      + itemPrice(item) + action('add', id, '加入本桌清单', 'Add to table selection', 'quick-add', '+') + '</li>'
    ).join('');
    if (!rows) return '';
    return '<section class="menu-chapter"><div class="chapter-heading"><span aria-hidden="true">'
      + String(chapter + 1).padStart(2, '0') + '</span><h2>' + bilingual(zh, en) + '</h2></div>'
      + '<ul class="menu-list">' + rows + '</ul></section>';
  }).join('');
  const note = route === 'drinks'
    ? '<p class="menu-note">' + bilingual('含酒精饮品仅供成年人。', 'Alcoholic drinks are for adults only.') + '</p>'
    : '';
  content.innerHTML = '<div class="filters" role="group" aria-label="菜单章节 / Menu chapters">' + filters + '</div>'
    + note + (region ? '<p class="menu-note">' + bilingual(region + ' · 菜系筛选', 'Regional selection') + '</p>' : '')
    + (chapters || copy('此章节暂无菜品。', 'No selections in this chapter.'))
    + '<nav class="menu-next" aria-label="茶酒搭配 / Pairings"><a href="#tea">以茶入席 <span lang="en">Tea Pairings ↗</span></a>'
    + '<a href="#wine">以酒入席 <span lang="en">Cocktail Pairings ↗</span></a></nav>';
  updateOrder();
}

function renderPairings() {
  const tea = route === 'tea';
  const pairs = cuisines.map(([seal, , , dishName, teaName, teaEn, cocktail]) => {
    const dish = items.find(item => item.name === dishName);
    const drinkName = tea ? teaName : cocktail;
    const id = items.findIndex(item => item.name === drinkName);
    const drink = items[id];
    if (!dish || (!tea && !drink)) return '';
    return '<article class="pair"><span class="pair-label">' + seal + '</span><h2>' + bilingual(dish.name, dish.en)
      + '</h2><p class="pair-drink">' + bilingual('配 ' + drinkName, 'With ' + (drink?.en || teaEn)) + '</p>'
      + (drink ? action('add', id, '加入本桌清单', tea ? 'Add tea' : 'Add drink', 'quick-add', '+') : '')
      + '</article>';
  });
  content.innerHTML = (tea
    ? copy('八道代表菜，各配一款茶。菜单上有的茶可直接加入本桌清单。', 'Eight dishes, each paired with a tea. Add any tea available on the drinks list.')
    : copy('八道代表菜，各配一款中式特调。含酒精饮品仅供成年人。', 'Eight dishes, each paired with a Chinese-inspired cocktail. For adults only.'))
    + '<div class="pair-list">' + pairs.join('') + '</div>'
    + (tea ? '<div class="pair-switch"><a href="#wine">以酒入席 <span lang="en">Cocktail Pairings ↗</span></a></div>'
      : '<div class="pair-switch"><a href="#tea">以茶入席 <span lang="en">Tea Pairings ↗</span></a></div>');
  updateOrder();
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
  if (dialog.open) dialog.close();
  document.querySelectorAll('.site-header a[href^="#"]').forEach(link => {
    if (link.hash === '#' + route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('home').hidden = Boolean(route);
  $('feature').hidden = !route;
  updateOrder();
  if (!route) {
    document.title = '日膳夜酌 · 八方有味 | Ba Fang';
    if (focus && previous) {
      window.scrollTo(0, 0);
      (document.querySelector('#home a[href="#' + previous + '"]') || document.querySelector('.reserve-link'))
        .focus({preventScroll: true});
    }
    return;
  }
  const [title, subtitle, kicker] = pages[route];
  $('title').innerHTML = bilingual(title, subtitle);
  $('feature-kicker').textContent = kicker;
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

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  $('main').focus();
});
$('close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (dialogTrigger instanceof HTMLElement && dialogTrigger.getClientRects().length) dialogTrigger.focus({preventScroll: true});
});
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
    const selected = content.querySelector('.filters button[aria-pressed="true"]');
    selected.focus({preventScroll: true});
    selected.scrollIntoView({block: 'nearest', inline: 'nearest'});
    const chapter = content.querySelector('.menu-chapter');
    if (chapter && chapter.getBoundingClientRect().top < 52) {
      window.scrollBy(0, chapter.getBoundingClientRect().top - 65);
    }
  }
  if (name === 'detail') showItem(id);
  if (name === 'add') {
    adjust(id, 1);
    if (dialog.open) dialog.close();
    $('order-feedback').textContent = '已加入 · ' + items[id].name + ' × ' + order.get(id);
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { $('order-feedback').textContent = ''; }, 2500);
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
