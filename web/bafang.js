'use strict';

const items = menuData;
const pages = {
  menu: ['八方食志', 'À la Carte', 'THE FOOD MENU'], drinks: ['杯中八方', 'Tea, Wine & Cocktails', 'THE DRINKS LIST'],
  night: ['八方夜小食', 'Late-Night Bites', '21:00–02:00 · LATE NIGHT'],
  cuisines: ['八大菜系', 'Eight Regional Cuisines', 'EIGHT FLAVOURS'],
  heritage: ['茶艺与器物', 'Craft at the Table', 'HERITAGE & HOSPITALITY'],
  tea: ['以茶入席', 'Tea Sets', 'SET MENUS / 01'], wine: ['以酒入席', 'Regional Wine Sets', 'SET MENUS / 02'],
  passport: ['八方集章', 'Taste Passport', 'AT THE TABLE / 03'], reserve: ['订一席', 'Reservations', 'RESERVATIONS'],
};
const groups = {
  menu: [['开席','Small Plates & Starters'],['山海','Seafood'],['炙火','Meat & Grill'],
    ['田园','Vegetables'],['五谷','Rice, Noodles & Dim Sum'],['余味','Desserts']],
  drinks: [['tea','Chinese Tea','中国茶'],['regional','Regional Wines & Beer','地方酿造酒'],
    ['清饮','Coffee & Soft Drinks','咖啡与清饮'],['夜酌','Cocktails','中式特调']],
  night: [['snacks','Late-Night Bites','八方夜小食']],
};
const cuisines = [
  ['浙','浙菜','Zhejiang','清鲜 · 茶香','龙井虾仁'],
  ['粤','粤菜','Cantonese','清鲜 · 陈香','豉油清蒸时鱼'],
  ['鲁','鲁菜','Shandong','醇鲜 · 葱香','葱烧海参'],
  ['苏','苏菜','Jiangsu','柔和 · 鲜甜','桂花糖醋小排'],
  ['闽','闽菜','Fujian','海味 · 糟香','红糟蒸海鲈'],
  ['徽','徽菜','Anhui','山珍 · 醇厚','徽州刀板香'],
  ['川','川菜','Sichuan','椒麻 · 鲜香','藤椒脆皮鸡'],
  ['湘','湘菜','Hunan','鲜辣 · 烟香','小炒黄牛肉'],
];
const slots = ['11:30','12:00','12:30','13:00','13:30','17:30','18:00','18:30','19:00','19:30','20:00','20:30',
  '21:00','21:30','22:00','22:30','23:00','23:30','00:00','00:30','01:00','01:30'];
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

const menuRoutes = Object.keys(groups);
const teaNames = new Set(['龙井绿茶','碧螺春','黄山毛峰','武夷岩茶','陈皮普洱','安化黑茶']);
const itemCategory = item => teaNames.has(item.name) ? 'tea' : item.category;
let route = '';
let setService = 0;
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
  $('order-dock').hidden = !count && !menuRoutes.includes(route);
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

function itemPrice(item) {
  const unit = item.volume ? item.volume + ' mL' : teaNames.has(item.name) ? '每壶 / Per pot' : '';
  return '<span class="item-price"><strong class="price">¥' + item.price + '</strong>'
    + (unit ? '<small lang="en">' + unit + '</small>' : '') + '</span>';
}

function showItem(id) {
  const item = items[id];
  if (!item) return;
  showDialog('<span class="seal">' + escape(item.seal) + '</span>' + bilingual(item.name, item.en),
    photo(item, false) + '<p class="detail-copy">' + bilingual(item.flavour, item.flavourEn)
    + (item.abv ? '<small lang="en">' + escape(item.abv) + ' ABV</small>' : '') + '</p>'
    + '<div class="detail-actions">' + itemPrice(item)
    + action('add', id, '加入本桌清单', 'Add to table selection', 'primary detail-add') + '</div>');
  dialogContent.querySelector('.detail-add').disabled = (order.get(id) || 0) >= 99;
}

function renderMenu() {
  const options = [['', 'All', '全部'], ...groups[route]];
  const activeCuisine = cuisines.find(([seal]) => seal === region);
  const filters = options.map(([key, en, zh = key]) =>
    '<button type="button" data-action="filter" data-category="' + key
    + '" aria-pressed="' + (category === key) + '">' + bilingual(zh, en) + '</button>').join('');
  const chapters = groups[route].map(([key, en, zh = key], chapter) => {
    if (category && key !== category) return '';
    const rows = items.map((item, id) => ({item, id})).filter(({item}) =>
      itemCategory(item) === key && (!region || item.seal === region)
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
  const note = route === 'night'
    ? copy('21:00 后供应八方小食与饮品。', 'From 21:00, we serve regional bites and drinks.')
    : route === 'drinks'
      ? copy('含酒精饮品仅供成年人。标有 * 的酒精度以实际酒标为准。', 'Alcoholic drinks are for adults only. For ABV marked *, check the bottle label.')
      : copy('午市及晚市供应 · 菜品可按类别或菜系浏览。', 'Served at lunch and dinner. Browse by chapter or cuisine.');
  const regionNote = activeCuisine
    ? '<p class="active-region"><span class="seal" aria-hidden="true">' + activeCuisine[0] + '</span>'
      + escape(activeCuisine[1] + ' · ' + activeCuisine[3])
      + ' <a href="./#' + route + '">查看完整菜单 <span lang="en">Full Menu</span></a></p>' : '';
  content.innerHTML = note + regionNote
    + (route !== 'night' ? '<div class="filters" role="group" aria-label="菜单章节 / Menu chapters">' + filters + '</div>' : '')
    + (chapters || copy('该类别暂无此菜系的菜品。可切换至全部类别。', 'There are no dishes in this chapter for the selected cuisine. Try All.'))
    + (route === 'night' ? '<nav class="menu-next"><a href="#drinks">查看饮品 <span lang="en">Drinks ↗</span></a></nav>'
      : '<nav class="menu-next" aria-label="套餐 / Set menus"><a href="#tea">以茶入席 <span lang="en">Tea Sets ↗</span></a>'
        + '<a href="#wine">以酒入席 <span lang="en">Wine Sets ↗</span></a></nav>');
  updateOrder();
}

function renderSets() {
  const tea = route === 'tea';
  const volume = tea
    ? [['所选茶一壶，约 500 mL','One pot, approx. 500 mL'],['所选两款各一壶，每壶约 450 mL','One pot of each, approx. 450 mL each']]
    : [['所选酒两杯，每杯 60 mL','Two 60 mL glasses of the chosen wine'],['所选两款各 160 mL，全桌分杯试饮','160 mL of each, shared at the table']];
  const portions = [
    ['咸口菜与主食供两人分享，红糖冰粉每位一份。','Savoury courses are shared. Each guest receives one ice jelly.'],
    ['三位或四位同菜、同量、同价，按四位分享份量出品。','The same dishes, four-person portions and price apply to parties of three or four.'],
  ];
  const cards = setMenus.map((set, index) => {
    const {prices, dishes} = set.services[setService];
    const drinks = set[route].map(name => {
      const item = items[itemIds.get(name)];
      return '<li>' + photo(item) + '<span>' + bilingual(item.name, item.en) + '</span></li>';
    }).join('');
    return '<article class="set-card"><div class="set-head"><div><p class="eyebrow">'
      + (index === 0 ? '02 GUESTS' : '03–04 GUESTS') + '</p><h2>' + bilingual(set.name, set.en)
      + '</h2></div><div class="set-price"><strong class="price">¥' + prices[tea ? 0 : 1]
      + '</strong><small lang="en">全桌 / Per table</small></div></div>'
      + '<ol class="set-dishes">' + dishes.map(name => {
        const id = itemIds.get(name);
        const item = items[id];
        return '<li>' + action('detail', id, '查看详情', 'Details', 'set-dish',
          '<span class="seal">' + item.seal + '</span><span>' + bilingual(item.name, item.en) + '</span>') + '</li>';
      }).join('') + '</ol>' + copy(...portions[index])
      + '<div class="set-drinks"><h3>' + (index === 0
        ? bilingual(tea ? '茶饮 · 两款选一' : '地方酒 · 两款选一', 'Choose 1 of 2')
        : bilingual(tea ? '茶饮 · 三款选二' : '地方酒 · 三款选二', 'Choose 2 of 3'))
      + '</h3><ul>' + drinks + '</ul>' + copy(...volume[index]) + '</div></article>';
  }).join('');
  content.innerHTML = copy('全桌选择茶套餐或酒套餐。套餐菜品固定，饮品按所示数量选择。', 'Choose a tea or wine set for the table. Dishes are fixed, with a choice of drinks.')
    + '<div class="filters set-period" role="group" aria-label="用餐时段 / Service">'
    + [['午市','Lunch'],['晚市','Dinner']].map(([zh,en], i) => '<button type="button" data-action="service" data-service="'
      + i + '" aria-pressed="' + (i === setService) + '">' + bilingual(zh, en) + '</button>').join('') + '</div>'
    + '<div class="set-grid">' + cards + '</div>'
    + '<div class="pair-switch"><a href="' + (tea ? '#wine">' + bilingual('以酒入席','Wine Sets ↗')
      : '#tea">' + bilingual('以茶入席','Tea Sets ↗')) + '</a></div>';
}

function renderCuisines() {
  content.innerHTML = copy('从浙菜的茶香到湘菜的烟辣。每个印章都能打开对应的正餐和夜宵。', 'From Zhejiang’s tea notes to Hunan’s smoky heat. Browse each region’s dishes and late-night bites.')
    + '<div class="regional-gallery">' + cuisines.map(([seal, zh, en, flavour, dish]) =>
      '<article>' + photo(items[itemIds.get(dish)]) + '<div><h2><span class="seal">' + seal + '</span>' + bilingual(zh, en)
      + '</h2><p>' + escape(flavour) + '</p><nav aria-label="' + zh + '菜单"><a href="#menu/' + encodeURIComponent(seal)
      + '">正餐 <span lang="en">Food ↗</span></a><a href="#night/' + encodeURIComponent(seal)
      + '">夜小食 <span lang="en">Bites ↗</span></a></nav></div></article>').join('') + '</div>';
}

function renderHeritage() {
  content.innerHTML = '<div class="heritage-grid">'
    + '<article>' + photo(items[itemIds.get('龙井虾仁')])
    + '<h2>' + bilingual('器以载味','Longquan Celadon') + '</h2>'
    + copy('龙泉青瓷的传统烧制技艺启发了龙井虾仁的器物设计，温润的青釉衬托虾仁与茶香。', 'Traditional Longquan celadon firing inspires the tableware concept for Longjing Tea Prawns.')
    + '</article><article>' + photo(items[itemIds.get('龙井绿茶')])
    + '<h2>' + bilingual('茶有来处','Traditional Chinese Tea Craft') + '</h2>'
    + copy('从制茶到待客，茶承载着分享的习惯。龙井的清香和乌龙的焙香也融入了我们的夜酌。', 'Tea is part of the way we welcome guests. Our evening cocktails draw on the fresh aroma of Longjing and the roasted notes of oolong.')
    + '</article></div>'
    + '<section class="heritage-pairings"><h2>' + bilingual('从一口到一杯', 'From Plate to Glass') + '</h2><ul>'
    + [['龙井虾仁','龙井金汤力'],['陈皮蜜汁叉烧','陈皮威士忌酸'],['红糟蒸海鲈','乌龙嗨棒']].map(pair => {
      const [dish, drink] = pair.map(name => items[itemIds.get(name)]);
      return '<li><span class="seal" aria-hidden="true">' + dish.seal + '</span>'
        + '<span>' + bilingual(dish.name + ' × ' + drink.name, dish.en + ' × ' + drink.en) + '</span></li>';
    }).join('') + '</ul></section>';
}

$('cuisine-links').innerHTML = cuisines.map(([seal, zh, en]) => '<a href="#menu/' + encodeURIComponent(seal)
  + '"><b aria-hidden="true">' + seal + '</b>' + bilingual(zh, en) + '</a>').join('')
  + '<a class="all-regions" href="#cuisines">' + bilingual('看八方','All Regions ↗') + '</a>';

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
    + '<form id="reservation"><label><span>' + bilingual('到店日期（午夜后请选次日）', 'Arrival date (choose the next day after midnight)')
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
  const [name, encodedRegion] = location.hash.slice(1).split('/');
  const linkedRegion = cuisines.find(([seal]) => [seal, encodeURIComponent(seal)].includes(encodedRegion))?.[0];
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
  if (menuRoutes.includes(route)) {
    const query = new URLSearchParams(location.search);
    const legacyCategories = {starters:'开席',vegetables:'田园',seafood:'山海',grains:'五谷',
      grill:'炙火',desserts:'余味',soft:'清饮',cocktails:'夜酌',tea:'tea',regional:'regional'};
    const requested = legacyCategories[query.get('category')];
    category = groups[route].some(([name]) => name === requested) ? requested : '';
    const requestedRegion = linkedRegion || query.get('region');
    region = route !== 'drinks' && cuisines.some(([seal]) => seal === requestedRegion) ? requestedRegion : '';
    renderMenu();
  }
  if (route === 'tea' || route === 'wine') renderSets();
  if (route === 'cuisines') renderCuisines();
  if (route === 'heritage') renderHeritage();
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
  if (name === 'service') {
    setService = Number(button.dataset.service);
    renderSets();
    content.querySelector('.set-period [aria-pressed="true"]').focus({preventScroll:true});
  }
  if (name === 'filter') {
    category = button.dataset.category;
    renderMenu();
    const selected = content.querySelector('.filters [aria-pressed="true"]');
    selected.focus({preventScroll: true});
    selected.scrollIntoView({block: 'nearest', inline: 'nearest'});
    const chapter = content.querySelector('.menu-chapter');
    const controls = content.querySelector('.filters');
    if (chapter && chapter.getBoundingClientRect().top < controls.offsetHeight) {
      window.scrollBy(0, chapter.getBoundingClientRect().top - controls.offsetHeight - 12);
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
