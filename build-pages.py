from html.parser import HTMLParser
from pathlib import Path
from shutil import copytree
from zipfile import ZipFile
import json
import re


CATEGORIES = ('开席', '田园', '山海', '五谷', '炙火', '余味', '清饮', '夜酌')
FIELDS = {
    'dish-en': 'en', 'dish-category-tag': 'category',
    'dish-ingredients': 'flavour', 'seal small': 'seal',
}
VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
             'link', 'meta', 'param', 'source', 'track', 'wbr'}


class MenuParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards = []
        self.card = None
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set(attrs.get('class', '').split())
        if self.card is None:
            if tag == 'button' and 'dish-card' in classes:
                self.card = {}
                self.stack = [(tag, None)]
            return
        if tag == 'img' and 'dish-card-image' in classes:
            self.card['image'] = [attrs.get('src', '')]
        if tag in VOID_TAGS:
            return
        field = {'h3': 'name', 'strong': 'price'}.get(tag)
        for selector, name in FIELDS.items():
            if set(selector.split()) <= classes:
                field = name
        if tag == 'small' and self.stack[-1][1] == 'flavour':
            field = 'flavourEn'
        self.stack.append((tag, field))

    def handle_endtag(self, tag):
        if self.card is None or tag in VOID_TAGS:
            return
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break
        if not self.stack:
            self.cards.append({key: ' '.join(value).strip() for key, value in self.card.items()})
            self.card = None

    def handle_data(self, text):
        if self.card is None or not text.strip():
            return
        field = next((field for _, field in reversed(self.stack) if field), None)
        if field:
            self.card.setdefault(field, []).append(text.strip())


def from_client_data(archive, members):
    fields = ('name', 'en', 'image', 'price', 'category', 'seal', 'ingredients', 'englishIngredients', 'note')
    raw_categories = dict(zip(('starters', 'vegetables', 'seafood', 'grains', 'grill', 'desserts', 'soft', 'cocktails'), CATEGORIES))
    result = []
    for member in members:
        if not re.search(r'/data-[^/]+\.js$', member):
            continue
        script = archive.read(member).decode('utf-8')
        for match in re.finditer(r'\{((?:[^{}"\\]|"(?:\\.|[^"\\])*")*)\}', script):
            item = {}
            for field in fields:
                token = re.search(r'(?:^|,)\s*' + field + r'\s*:\s*("(?:\\.|[^"\\])*"|\d+)(?=,|$)', match[1])
                if token:
                    item[field] = json.loads(token[1])
            if set(fields[:-1]) <= item.keys() and item['category'] in raw_categories:
                item['flavour'] = item.pop('ingredients')
                item['flavourEn'] = item.pop('englishIngredients')
                item['category'] = raw_categories[item['category']]
                result.append(item)
    return result


def from_menu_html(archive, members):
    parser = MenuParser()
    path = 'menu.html' if 'menu.html' in members else 'menu/index.html'
    parser.feed(archive.read(path).decode('utf-8'))
    records = []
    for card in parser.cards:
        category = next((name for name in CATEGORIES if card.get('category', '').startswith(name)), None)
        price = re.search(r'(\d+)', card.get('price', ''))
        if category is None or price is None:
            raise ValueError(f'Unable to preserve original category or price for {card.get("name")}')
        card['category'] = category
        card['price'] = int(price[1])
        records.append(card)
    return records


def redirect(root, target):
    home = root + target
    return f"""<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>日膳夜酌 · 八方有味</title>
<script>location.replace({json.dumps(root)} + location.search + {json.dumps(target)});</script>
<p><a href="{home}">继续访问八方有味 / Continue to Ba Fang</a></p></html>
"""


def build():
    out = Path('public')
    out.mkdir(exist_ok=True)
    copytree('web', out, dirs_exist_ok=True)
    with ZipFile('site.zip') as archive:
        members = set(archive.namelist())
        records = from_client_data(archive, members)
        if len(records) != 66:
            records = from_menu_html(archive, members)
        if len(records) != 66 or len({item['name'] for item in records}) != 66:
            raise ValueError(f'Expected the 66 original selections, got {len(records)}')
        if {item['category'] for item in records} != set(CATEGORIES):
            raise ValueError('Missing an original menu category')
        required = ('name', 'en', 'image', 'price', 'category', 'seal', 'flavour', 'flavourEn')
        images = {'images/table.webp', 'favicon.svg'}
        for item in records:
            if not all(item.get(field) for field in required):
                raise ValueError(f'Incomplete bilingual entry: {item.get("name")}')
            image = 'images/' + item['image'].split('/images/', 1)[-1] if '/images/' in item['image'] else item['image']
            if image not in members:
                raise ValueError(f'Missing original photograph: {image}')
            item['image'] = image
            images.add(image)
        for path in sorted(images):
            archive.extract(path, out)
    data = json.dumps(records, ensure_ascii=False, separators=(',', ':'))
    (out / 'menu-data.js').write_text('const menuData = ' + data + ';\n', encoding='utf-8')
    (out / '.nojekyll').touch()
    redirects = {'menu': '#menu', 'drinks': '#drinks', 'reserve': '#reserve', 'day-night': '#drinks',
                 'flavours': '#passport', 'experience': '#menu', 'about': '', 'heritage': ''}
    for old, target in redirects.items():
        directory = out / old
        directory.mkdir(exist_ok=True)
        (directory / 'index.html').write_text(redirect('../', target), encoding='utf-8')
        (out / f'{old}.html').write_text(redirect('./', target), encoding='utf-8')
    print(f'Preserved {len(records)} bilingual selections and {len(images) - 1} original photographs.')


if __name__ == '__main__':
    build()
