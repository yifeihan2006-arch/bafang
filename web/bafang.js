'use strict';

const items = menuData;
const pages = {
  menu: ['八方食志', 'À la Carte', ['正餐菜单','Food Menu']],
  drinks: ['午晚市饮品', 'Lunch & Dinner Drinks', ['中国茶与地方酿造酒','Chinese Tea, Regional Wines & Beer']],
  'night-drinks': ['夜宵饮品', 'Late-Night Drinks', ['供应时段 21:00–次日 02:00','Service Hours']],
  night: ['八方夜小食', 'Late-Night Bites', ['供应时段 21:00–次日 02:00','Service Hours']],
  heritage: ['茶艺与器物', 'Craft at the Table', ['非遗与待客之道','Heritage & Hospitality']],
  tea: ['以茶入席套餐', 'Tea Sets', ['01 套餐','Set Menus']],
  wine: ['以酒入席套餐', 'Regional Wine Sets', ['02 套餐','Set Menus']],
  passport: ['八方集章', 'Taste Passport', ['03 席间雅事','At the Table']],
  reserve: ['订一席', 'Reservations', ['预订意向','Reservation Requests']],
};
const groups = {
  menu: [['开席','Small Plates & Starters'],['山海','Seafood'],['炙火','Meat & Grill'],
    ['田园','Vegetables'],['五谷','Rice, Noodles & Dim Sum'],['余味','Desserts']],
  drinks: [['tea','Chinese Tea','中国茶'],['regional','Regional Wines & Beer','地方酿造酒']],
  'night-drinks': [['清饮','Coffee & Soft Drinks','咖啡与清饮'],['夜酌','Chinese-Inspired Cocktails','中式特调']],
  night: [['snacks','Late-Night Bites','八方夜小食']],
};
const cuisines = [
  ['浙','浙菜','Zhejiang'],
  ['粤','粤菜','Cantonese'],
  ['鲁','鲁菜','Shandong'],
  ['苏','苏菜','Jiangsu'],
  ['闽','闽菜','Fujian'],
  ['徽','徽菜','Anhui'],
  ['川','川菜','Sichuan'],
  ['湘','湘菜','Hunan'],
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
const forwardArrow = '<svg class="link-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 11.5l7-7m-5 0h5v5"/></svg>';
const setLink = target => '<a href="#' + target + '">' + pages[target][0]
  + ' <span lang="en">' + pages[target][1] + '</span>' + forwardArrow + '</a>';
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
    + ' / Table selection, ' + count + ' items, total ¥' + total);
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
  $('status').textContent = items[index].name + ' × ' + quantity + '，本桌清单已更新。 / ' + items[index].en + ' × ' + quantity + ', table selection updated.';
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
    + (lines.join('') || copy('本桌清单还是空的。', 'Your selection is empty.'))
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
  const unit = item.volume ? item.volume + ' mL' : teaNames.has(item.name) ? '<span lang="zh-CN">每壶</span> / Per pot' : '';
  return '<span class="item-price"><strong class="price">¥' + item.price + '</strong>'
    + (unit ? '<small lang="en">' + unit + '</small>' : '') + '</span>';
}

function showItem(id) {
  const item = items[id];
  if (!item) return;
  showDialog('<span class="seal">' + escape(item.seal) + '</span>' + bilingual(item.name, item.en),
    photo(item, false) + '<p class="detail-copy">' + bilingual(item.flavour, item.flavourEn)
    + (item.abv ? '<small lang="en"><span lang="zh-CN">酒精度</span> ' + escape(item.abv) + ' ABV</small>' : '') + '</p>'
    + '<div class="detail-actions">' + itemPrice(item)
    + action('add', id, '加入本桌清单', 'Add to table selection', 'primary detail-add') + '</div>');
  dialogContent.querySelector('.detail-add').disabled = (order.get(id) || 0) >= 99;
}

function renderMenu() {
  const options = [['', 'All', '全部'], ...groups[route]];
  const filters = options.map(([key, en, zh = key]) =>
    '<button type="button" data-action="filter" data-category="' + key
    + '" aria-pressed="' + (category === key) + '">' + bilingual(zh, en) + '</button>').join('');
  const chapters = groups[route].map(([key, en, zh = key], chapter) => {
    if (category && key !== category) return '';
    const rows = items.map((item, id) => ({item, id})).filter(({item}) =>
      itemCategory(item) === key
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
  const notes = {
    menu: ['正餐于午市及晚市供应。', 'The à la carte menu is served at lunch and dinner.'],
    drinks: ['中国茶及地方酿造酒仅于午市和晚市供应。标有 * 的酒精度以实际酒标为准。',
      'Chinese tea, regional wines and beer are served at lunch and dinner only. For ABV marked *, check the bottle label.'],
    night: ['夜宵小食供应时间为 21:00 至次日 02:00。', 'Late-night bites are served from 21:00 to 02:00 the following day.'],
    'night-drinks': ['中式特调、咖啡与清饮于 21:00 至次日 02:00 供应。', 'Chinese-inspired cocktails, coffee and soft drinks are served from 21:00 to 02:00 the following day.'],
  };
  const [relatedRoute, relatedZh, relatedEn] = {
    menu: ['drinks', '查看午晚市饮品', 'View Lunch & Dinner Drinks'],
    drinks: ['menu', '查看正餐菜单', 'View Food Menu'],
    night: ['night-drinks', '查看夜宵饮品', 'View Late-Night Drinks'],
    'night-drinks': ['night', '查看夜宵小食', 'View Late-Night Bites'],
  }[route];

  const isDrinks = route === 'drinks' || route === 'night-drinks';
  const links = isDrinks
    ? '<nav class="drink-switch" aria-label="饮品时段 / Drinks by service">'
      + [['drinks','午晚市饮品','Lunch & Dinner Drinks'],['night-drinks','夜宵饮品','Late-Night Drinks']].map(([target, zh, en]) =>
        '<a href="#' + target + '"' + (target === route ? ' aria-current="page"' : '') + '>' + bilingual(zh, en) + '</a>').join('')
      + '</nav>'
    : '';
  content.innerHTML = links + copy(...notes[route])
    + (route !== 'night' ? '<div class="filters" role="group" aria-label="菜单章节 / Menu chapters">' + filters + '</div>' : '')
    + chapters
    + (route === 'menu' ? '<nav class="menu-next" aria-label="套餐 / Set Menus">' + setLink('tea') + setLink('wine') + '</nav>'
      : '')
    + '<nav class="menu-related" aria-label="相关菜单 / Related Menu"><a href="#' + relatedRoute + '">'
    + '<span class="related-label"><span class="related-kicker" aria-hidden="true">继续浏览 <span lang="en">· EXPLORE MORE</span></span>'
    + '<span class="related-title">' + bilingual(relatedZh, relatedEn) + '</span></span>'
    + '<span class="related-arrow" aria-hidden="true">' + forwardArrow + '</span></a></nav>';
  updateOrder();
}

function renderSets() {
  const tea = route === 'tea';
  const volume = tea
    ? [['所选茶一壶，约 500 mL','One pot of the chosen tea, approx. 500 mL'],['所选两款各一壶，每壶约 450 mL','One pot of each selected tea, approx. 450 mL per pot']]
    : [['所选酒两杯，每杯 60 mL','Two 60 mL glasses of the chosen wine'],['所选两款各 160 mL，全桌分杯试饮','160 mL of each selected wine, shared at the table']];
  const portions = [
    ['咸口菜与主食供两人分享，红糖冰粉每位一份。','Savoury dishes and staples are shared by two. Each guest receives one brown sugar ice jelly.'],
    ['三位或四位同菜、同量、同价，按四位分享份量出品。','The same dishes, four-person portions and price apply to parties of three or four.'],
  ];
  const cards = setMenus.map((set, index) => {
    const {prices, dishes} = set.services[setService];
    const drinks = set[route].map(name => {
      const item = items[itemIds.get(name)];
      return '<li>' + photo(item) + '<span>' + bilingual(item.name, item.en) + '</span></li>';
    }).join('');
    return '<article class="set-card"><div class="set-head"><div><p class="eyebrow">'
      + (index === 0 ? '2 位 <span lang="en">· 2 GUESTS</span>' : '3–4 位 <span lang="en">· 3–4 GUESTS</span>') + '</p><h2>' + bilingual(set.name, set.en)
      + '</h2></div><div class="set-price"><strong class="price">¥' + prices[tea ? 0 : 1]
      + '</strong><small lang="en"><span lang="zh-CN">全桌</span> / Per table</small></div></div>'
      + '<ol class="set-dishes">' + dishes.map(name => {
        const id = itemIds.get(name);
        const item = items[id];
        return '<li>' + action('detail', id, '查看详情', 'Details', 'set-dish',
          '<span class="seal">' + item.seal + '</span><span>' + bilingual(item.name, item.en) + '</span>') + '</li>';
      }).join('') + '</ol>' + copy(...portions[index])
      + '<div class="set-drinks"><h3>' + (index === 0
        ? bilingual(tea ? '茶饮 · 两款选一' : '地方酒 · 两款选一', tea ? 'Choose 1 of 2 Teas' : 'Choose 1 of 2 Regional Wines')
        : bilingual(tea ? '茶饮 · 三款选二' : '地方酒 · 三款选二', tea ? 'Choose 2 of 3 Teas' : 'Choose 2 of 3 Regional Wines'))
      + '</h3><ul>' + drinks + '</ul>' + copy(...volume[index]) + '</div></article>';
  }).join('');
  content.innerHTML = copy('全桌选择茶套餐或酒套餐。套餐菜品固定，饮品按所示数量选择。', 'Choose a tea or wine set for the whole table. Dishes are fixed. Choose the number of drinks indicated for your set.')
    + '<div class="filters set-period" role="group" aria-label="用餐时段 / Service">'
    + [['午市','Lunch'],['晚市','Dinner']].map(([zh,en], i) => '<button type="button" data-action="service" data-service="'
      + i + '" aria-pressed="' + (i === setService) + '">' + bilingual(zh, en) + '</button>').join('') + '</div>'
    + '<div class="set-grid">' + cards + '</div>'
    + '<div class="pair-switch">' + setLink(tea ? 'wine' : 'tea') + '</div>';
}

function renderHeritage() {
  const crafts = [
    {
      number: '01', year: '2022', image: '龙井绿茶',
      title: ['茶有来处', 'From Leaf to Cup'],
      element: ['中国传统制茶技艺及其相关习俗', 'Traditional tea processing techniques and associated social practices in China'],
      story: ['茶从栽培、采摘到手工制作，各地因气候与习惯形成了不同的做法。泡茶、敬茶与分茶，也是待客和亲友相聚的一部分。',
        'Local climates and customs shape how tea is grown, picked and made by hand. Brewing, serving and sharing tea are part of welcoming guests and spending time with family and friends.'],
      steps: [['采摘','Pick'],['制茶','Process'],['奉茶','Serve']],
      atTable: ['从龙井的清鲜到武夷岩茶的焙香，午晚市茶单让客人从一壶茶认识不同的风味。',
        'Our lunch and dinner tea list moves from fresh Longjing to roasted Wuyi rock tea, one pot at a time.'],
      url: 'https://ich.unesco.org/en/RL/traditional-tea-processing-techniques-and-associated-social-practices-in-china-01884',
    },
    {
      number: '02', year: '2009', image: '龙井虾仁',
      title: ['器以载味', 'A Vessel for Flavour'],
      element: ['龙泉青瓷传统烧制技艺', 'Traditional firing technology of Longquan celadon'],
      story: ['浙江龙泉的匠人将釉施于已烧过的器坯上，再入窑复烧。烧制时细察火色并控制升温与降温，才能呈现青瓷温润如玉的釉色。',
        'In Longquan, Zhejiang, artisans glaze a previously fired vessel and return it to the kiln. They watch the flame and control heating and cooling to bring out the jade-like finish.'],
      steps: [['施釉','Glaze'],['入窑','Fire'],['控温','Temperature Control']],
      atTable: ['龙井虾仁的摆盘借鉴青瓷的釉色，让淡青器面衬出虾仁和茶叶的色泽。',
        'Our plating for Longjing Tea Prawns takes its cue from celadon. The pale green plate sets off the colours of the prawns and tea leaves.'],
      url: 'https://ich.unesco.org/en/RL/longquan-celadon-firing-technology-00205',
    },
  ];
  content.innerHTML = copy('一壶茶，一只盘，从八方的餐桌认识两项中国非遗。', 'Discover two forms of Chinese intangible cultural heritage through a pot of tea and a plate at Bafang.')
    + '<div class="heritage-grid">' + crafts.map(craft =>
      '<article class="craft-story">' + photo(items[itemIds.get(craft.image)])
      + '<div class="craft-body"><p class="eyebrow craft-index">' + craft.number + ' · UNESCO ICH · ' + craft.year + '</p>'
      + '<h2>' + bilingual(...craft.title) + '</h2><p class="craft-element">' + bilingual(...craft.element) + '</p>'
      + copy(...craft.story)
      + '<ol class="craft-steps">' + craft.steps.map(([zh, en]) => '<li>' + bilingual(zh, en) + '</li>').join('') + '</ol>'
      + '<div class="craft-table"><h3>' + bilingual('在八方的餐桌上', 'At Bafang') + '</h3>' + copy(...craft.atTable) + '</div>'
      + '<a class="craft-link" href="' + craft.url + '" target="_blank" rel="noopener noreferrer" aria-label="'
      + escape('阅读 UNESCO 官方介绍：' + craft.element[0] + '（新窗口） / Read on UNESCO, opens in a new tab')
      + '">' + bilingual('阅读 UNESCO 官方介绍', 'Read on UNESCO') + forwardArrow + '</a></div></article>'
    ).join('') + '</div>';
}

// A tea sprig, bamboo steamer, scallions, osmanthus, wine jar, hills, peppercorns and chilli.
const cuisineMotifs = {
  浙: '<path d="M15 36c7-5 12-11 17-22M21 31c-5 0-9-4-9-9 5 0 9 3 9 9ZM26 26c0-6 5-10 10-10-1 5-5 9-10 10ZM23 29c5-3 10-3 13-1-3 4-9 5-13 1Z"/>',
  粤: '<ellipse cx="24" cy="25" rx="12" ry="4"/><path d="M12 25v8c0 5 24 5 24 0v-8M12 29c0 5 24 5 24 0M20 17c-3-2 2-3 0-6m5 6c-3-2 2-3 0-6m5 6c-3-2 2-3 0-6"/>',
  鲁: '<path d="M18 36c1-9 3-18 10-23-3 7-6 16-6 23h-4Zm4 0c3-9 7-15 15-19-5 6-8 12-10 19h-5Zm-4-2c0-6-1-11-5-16 5 1 8 5 8 9m-4 9-2 2m5-2v2m7-2 1 2"/>',
  苏: '<path d="M15 36c7-4 12-8 15-15m-8 10c-6 1-10-2-11-6 6-1 9 1 11 6Zm4-4c4 1 8 0 11-4-5-2-9 0-11 4Z"/><path d="M23 15c-2-3 1-5 3-3 2-2 5 0 3 3 3 2 1 5-2 4-1 3-5 1-4-2-3 0-3-3 0-2Z"/><path d="M34 14v6m-3-3h6"/>',
  闽: '<path d="M17 18h14v-5H17v5Zm2 0v4c-8 3-10 9-5 14h20c5-5 3-11-5-14v-4M13 31h22m-11-7 4 4-4 4-4-4 4-4Z"/>',
  徽: '<path d="m10 33 11-14 5 6 4-4 8 12H10Zm6-8 5 2 4-3m-11 13h20"/><circle cx="31" cy="15" r="3"/>',
  川: '<path d="M16 36c5-6 9-11 13-21m-8 13-6-4m10 1 7-2m-13 9 10 2"/><circle cx="29" cy="14" r="2.5"/><circle cx="14" cy="23" r="3"/><circle cx="34" cy="22" r="3"/><circle cx="32" cy="33" r="3"/><circle cx="20" cy="19" r="2.5"/>',
  湘: '<path d="M32 20c5 4 1 10-4 13-5 3-12 4-17 3 5-2 7-7 11-13 3-4 6-6 10-3Zm0 0c0-3 2-6 5-6m-13 12c1-2 3-4 5-4"/>',
};

function cuisineIcon(seal) {
  return '<svg class="cuisine-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">'
    + '<path class="cuisine-frame" d="M4 43V23a20 20 0 0 1 40 0v20H4Z"/>'
    + '<g class="cuisine-motif">' + cuisineMotifs[seal] + '</g></svg>';
}

$('cuisine-list').innerHTML = cuisines.map(([seal, zh, en]) =>
  '<li>' + cuisineIcon(seal) + bilingual(zh, en) + '</li>').join('');

function updateStamps() {
  $('stamp-count').textContent = String(stamps.size).padStart(2, '0');
  $('stamp-progress').value = stamps.size;
  content.querySelectorAll('[data-seal]').forEach(button => {
    const collected = stamps.has(button.dataset.seal);
    button.setAttribute('aria-pressed', collected);
    button.querySelector('.stamp-state').innerHTML = collected
      ? bilingual('已集章', 'Stamped') : bilingual('待集章', 'To collect');
  });
}

function renderPassport() {
  content.innerHTML = '<div class="passport-meter"><div><p class="eyebrow" lang="en">BAFANG TASTE PASSPORT</p>'
    + '<h2>' + bilingual('尝遍八方', 'Eight flavours to discover') + '</h2>'
    + '<progress id="stamp-progress" max="' + cuisines.length + '" aria-label="集章进度 / Stamp progress"></progress></div>'
    + '<p class="stamp-counter" role="status"><span id="stamp-count"></span><span> / 08</span>'
    + '<small lang="en"><span lang="zh-CN">已集章</span> · Collected</small></p></div>'
    + copy('尝过一道菜，就点一下对应菜系盖章。再次点按可撤销，进度保存在当前设备。',
      'After trying a dish, tap its cuisine to stamp your passport. Tap again to undo. Your progress is saved on this device.')
    + '<div class="stamps">' + cuisines.map(([seal,zh,en], index) =>
      '<button type="button" data-action="stamp" data-seal="' + seal + '" aria-label="' + escape(zh + ' / ' + en) + '">'
      + '<span class="stamp-index" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</span>'
      + '<span class="stamp-check" aria-hidden="true">✓</span>' + cuisineIcon(seal)
      + '<span class="stamp-label">' + bilingual(zh,en) + '</span><span class="stamp-state" aria-hidden="true"></span></button>'
    ).join('') + '</div><p id="stamp-status" role="status"></p>';
  updateStamps();
}

function restaurantDate(offset = 0) {
  return new Date(Date.now() + 28800000 + 86400000 * offset).toISOString().slice(0,10);
}
function renderReserve() {
  content.innerHTML = copy('选择日期、时间和人数，生成预订意向单。此功能为演示，餐厅暂未开放线上订位。',
    'Choose a date, time and party size to create a reservation request. This feature is for demonstration only. Online bookings are not yet open.')
    + '<form id="reservation"><label><span>' + bilingual('到店日期（午夜后请选次日）', 'Arrival date (for visits after midnight, select the next calendar day)')
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
    copy('此意向单仅供演示，尚未发送至餐厅。', 'This request is for demonstration only and has not been sent to the restaurant.')
    + '<p>' + escape(date) + ' · ' + escape(time) + ' (UTC+8) · ' + guests + ' 位 / Guests</p>'
    + '<button class="primary" type="button" data-action="download">' + bilingual('下载意向单', 'Download Request') + '</button>');
}
function downloadRequest() {
  if (!reservation) return;
  const {date,time,guests} = reservation;
  const body = ['日膳夜酌 · 八方有味', '预订意向单 / Demo Reservation Request', '',
    '日期 / Date: ' + date, '时间 / Time: ' + time + ' (UTC+8)', '人数 / Guests: ' + guests, '',
    '此意向单仅供演示，尚未发送至餐厅。', 'This request is for demonstration only and has not been sent to the restaurant.'].join('\n');
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
  const [name] = location.hash.slice(1).split('/');
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
    document.title = '日膳夜酌 · 八方有味 | Bafang';
    if (name === 'cuisines') {
      $('cuisines').scrollIntoView();
      if (focus) $('cuisine-title').focus({preventScroll:true});
    } else if (focus && previous) {
      window.scrollTo(0, 0);
      (document.querySelector('#home a[href="#' + previous + '"]') || document.querySelector('.reserve-link'))
        .focus({preventScroll: true});
    }
    return;
  }
  const [title, subtitle, kicker] = pages[route];
  $('title').innerHTML = bilingual(title, subtitle);
  $('feature-kicker').innerHTML = escape(kicker[0]) + ' <span lang="en">· ' + escape(kicker[1]) + '</span>';
  document.title = pages[route][0] + ' | 日膳夜酌 · 八方有味';
  if (menuRoutes.includes(route)) {
    const query = new URLSearchParams(location.search);
    const legacyCategories = {starters:'开席',vegetables:'田园',seafood:'山海',grains:'五谷',
      grill:'炙火',desserts:'余味',soft:'清饮',cocktails:'夜酌',tea:'tea',regional:'regional'};
    const requested = legacyCategories[query.get('category')];
    category = groups[route].some(([name]) => name === requested) ? requested : '';
    renderMenu();
  }
  if (route === 'tea' || route === 'wine') renderSets();
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
    $('order-feedback').innerHTML = bilingual('已加入 · ' + items[id].name + ' × ' + order.get(id),
      'Added · ' + items[id].en + ' × ' + order.get(id));
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
      ? '' : bilingual('当前浏览器暂时无法保存。', 'This browser is temporarily unable to save your stamps.');
    updateStamps();
  }
  if (name === 'download') downloadRequest();
});
renderRoute();
