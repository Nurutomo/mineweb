var socket = io(location.host);
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var W = window.innerWidth
  , H = window.innerHeight
  , scale = 2
  , gui = {}
  , mx = 0
  , my = 0;

var inventory = new Array(46).fill(null);
var request = [];
var color = [
  0x000,
  0x00A,
  0x0A0,
  0x0AA,
  0xA00,
  0xA0A,
  0xFA0,
  0xAAA,
  0x555,
  0x55F,
  0x5F5,
  0x5FF,
  0x5FF,
  0xF5F,
  0xFF5,
  0xFFF
];

const codes = {
  color: {
    black: '§0',
    dark_blue: '§1',
    dark_green: '§2',
    dark_aqua: '§3',
    dark_red: '§4',
    dark_purple: '§5',
    gold: '§6',
    gray: '§7',
    dark_gray: '§8',
    blue: '§9',
    green: '§a',
    aqua: '§b',
    red: '§c',
    light_purple: '§d',
    yellow: '§e',
    white: '§f'
  },
  bold: '§l',
  italic: '§o',
  underlined: '§n',
  strikethrough: '§m',
  obfuscated: '§k'
}

function render() {
  draw();
  requestAnimationFrame(render);
}

function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = `hsl(${(new Date() / 6374) * 360 % 360}deg, 100%, ${Math.sin(new Date() / 14237) * 10 + 40}%)`;
  ctx.fillRect(0, 0, W, H);
  drawInv();
}

function drawInv() {
  drawImg(gui.inventory, W / 2, H / 2, 0, 0, 16 * 11, 165, 0.5, 0.5);
  let [hW, hH] = [W / 2, H / 2];
  for (let item of inventory) {
    if (item == null) continue;
    let x = cord.inv[item.slot][0] * scale;
    let y = cord.inv[item.slot][1] * scale;
    drawItem(hW - (4 * 18 * scale) + x, hH + (9 * scale) + y, item);
  }

  for (let item of inventory) {
    if (item == null) continue;
    let x = cord.inv[item.slot][0] * scale;
    let y = cord.inv[item.slot][1] * scale;
    let tl = -8 * scale;
    let br = 8 * scale;
    if (inRange(mx, hW + tl + x - (4 * 18 * scale), hW + br + x - (4 * 18 * scale))
      && inRange(my, hH + tl + y + (9 * scale), hH + br + y + (9 * scale))) drawTooltip(mx, my, item);
    }
}

function inRange(value, min, max) {
  return min <= value && value <= max;
}

function drawTooltip(x, y, item) {
  x += 6 * scale;
  y += 6 * scale;
  ctx.font = `${8 * scale}px minecraftia`;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 5, y - 5, ctx.measureText(item.displayName).width + 8, 21);
  ctx.textAlign = 'left';
  ctx.fillStyle = "#fff";
  ctx.fillText(item.displayName, x, 6 * scale + y);
}

function drawItem(x, y, item) {
  drawImg(item.img, x, y, 0, 0, 16, 16, 0.5, 0.5);
  if (1 < item.count) {
    let sx = 8;
    let sy = 8;
    ctx.fillStyle = "#222";
    ctx.font = `${8 * scale}px minecraftia`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(item.count, x + ((sx + 1) * scale), y + ((sy + 1) * scale));
    ctx.fillStyle = "#fff";
    ctx.fillText(item.count, x + (sx * scale), y + (sy * scale));
  }
}

function drawImg(img, x, y, sx, sy, dx = img.width, dy = img.height, ax = 0, ay = 0) {
  sx = dx - sx;
  sy = dy - sy;
  dx = dx * scale;
  dy = dy * scale;
  try {
    ctx.drawImage(
      img,
      0, 0,
      sx, sy,
      x - (dx * ax), y - (dy * ay),
      dx, dy
      );
    } catch (e) {
    console.error(img, e);
  }
}

window.addEventListener('resize', resize);
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

async function getImg(url) {
  let img = new Image();
  img.src = url;
  return new Promise(resolve => {
    img.onload = async () => resolve(img);
  });
}

function setObj(obj, tree, value) {
  let deep = obj;
  for (key of tree.slice(0, -1)) {
    deep[key] = deep[key] || {};
    deep = deep[key];
  }
  deep[tree.pop()] = value;
  return obj;
}

document.addEventListener('DOMContentLoaded', async () => {
  document.body.appendChild(canvas);
  resize();
  gui.inventory = await getImg('minecraft/textures/gui/container/inventory.png');
  var input = document.querySelector('input')
  
  input.addEventListener('keypress', function (e) {
    if (e.charCode == 13) {
      socket.emit('chat', this.value);
      this.value = '';
    }
  });

  input.addEventListener('focus', e => {
    document.querySelectorAll('div#chat').setAttribute('data-focus', true);
    document.querySelectorAll('div#chat > span').forEach(el => {
      el.setAttribute('data-focus', true);
      if (el.style.opacity) el.style.opacity = 1;
    });
  });
  
  input.addEventListener('blur', e => {
    document.querySelectorAll('div#chat').setAttribute('data-focus', false);
    el.setAttribute('data-focus', false);
    document.querySelectorAll('div#chat > span').forEach(el => {
      el.style.opacity = 0;
    });
  });
});

var cord = {
  inv: {},
  generic: {}
};

n = 0;
cord.inv[n++] = [(8 * 18) + 1.5, -56];
for (let j = 0; j < 2; j++) {
  for (let i = 0; i < 2; i++, n++) {
    cord.inv[n] = [18 * i - .5 + (5 * 18), j * 18 - 65.5];
  }
}

for (let i = 0; i < 4; i++, n++) {
  cord.inv[n] = [-.5, i * 18 - 75.5];
}

for (let j = 0; j < 3; j++) {
  for (let i = 0; i < 9; i++, n++) {
    cord.inv[n] = [18 * i - .5, j * 18];
  }
}

for (let i = 0; i < 9; i++, n++) {
  cord.inv[n] = [18 * i, 3 * 18 + 4];
}

cord.inv[n++] = [4 * 18 - 3.5, -21.5]

socket.on('inv', async (inv) => {
  for (let item of inv) {
    inventory[item.slot] = item;
    inventory[item.slot].img = await getImg(item.texture)//.then(v => inventory[item.slot].img = v);
  }
  cancelAnimationFrame(render);
  render();
});

socket.on('invUpdate', async (inv) => {
  for (let i in inv) {
    let [item, slot] = inv[i];
    inventory[slot] = item == {} ? null : item;
    if (inventory[slot].texture != null) inventory[slot].img = await getImg(inventory[slot].texture)//.then(v => inventory[slot].img = v);
  }
});

socket.on('message', (msgs, lang) => {
  msgs.map(v => displayChat(v, lang));
  let chat = document.getElementById('chat');
  chat.scrollTop = chat.scrollHeight;
  while (200 < chat.childNodes.length / 2) chat.childNodes[0].remove();
});

socket.on('historyMessage', (msgs, lang) => {
  let chat = document.getElementById('chat');
  chat.innerHTML = "";
  msgs.map(v => displayChat(v, lang));
  chat.scrollTop = chat.scrollHeight;
  while (200 < chat.childNodes.length / 2) chat.childNodes[0].remove();
});

function displayChat(message, lang) {
  var span = document.querySelector('span.alt');
  console.log('Raw JSON', message);
  let html = formatHTML(message, lang);
  html.setAttribute('data-focus', false);
  if (html.getAttribute('data-focus')) setTimeout(() => html.style.opacity = 0, 8000);
  html.querySelectorAll('span[alt]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      span.innerHTML = el.getAttribute('alt');
      span.style.display = '';
    });
    el.addEventListener('mousemove', e => {
      span.style.transform = `translate(${e.pageX + 12}px, ${e.pageY - 12}px)`
    });
    el.addEventListener('mouseleave', () => {
      span.style.display = 'none';
    });
  });
  document.getElementById('chat').append(html, '\n');

  function formatHTML(json, lang, parent) {
    let l = '';
    let span = document.createElement('span');
    let other = json;
    className = `${Object.keys(codes).map((code) => {
      let json = { ...parent, ...other };
      if (!json[code] || json[code] === 'false') return null;
      if (code === 'color') return json.color;
      if (code === 'obfuscated') span.setAttribute('data-length', other.text.length);
      return code;
    }).filter(entry => !!entry).join(' ')}`;

    if (className) span.className = className;

    if (typeof json.text === 'string') {
      span.innerHTML = mcToSpan(_escape(json.text));
    }
    else if (json.with) {
      const args = json.with.map(entry => formatHTML(entry, lang));
      const format = lang[json.translate];
      let i = 0;
      if (!format) span.append(...args);
      else span.innerHTML += format.replace(/%\d\$s|%s/g, () => {
        return args[i++].outerHTML;
      })//, args);
    }

    if (json.clickEvent) {
      span.onclick = function () {
        switch (json.clickEvent.action) {
          case 'suggest_command':
            input.value = json.clickEvent.value;
            break;
        }
      }
    }
    if (json.hoverEvent) {
      let obj = json.hoverEvent.value;
      if (obj.text) {
        obj = new Function('return ' + obj.text)();
      }
      let tag = '';
      if (obj) {
        if (obj.tag && obj.tag.CustomName) {
          if (obj.tag.CustomName.text) tag = formatHTML(obj.tag.CustomName, lang, obj).outerHTML;
          else tag = obj.tag.CustomName;
          tag += '\n';
        }
        tag += obj.id
      }
      span.setAttribute('alt', tag);
    }
    if (json.extra) {
      span.append(...json.extra.map((entry, index) => formatHTML(entry, lang, index == 0 ? json : {})))
    }
    console.debug(span)
    return span;
  }

  function _escape(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

function toMotd(v) {
  let message = Object.keys(codes).map((code) => {
    if (!v[code] || v[code] === 'false') return null
    if (code === 'color') return codes.color[v.color]
    return codes[code]
  }).join('')

  if (typeof v.text === 'string') message += `${v.text}§r`
  else if (v.with) {
    const args = v.with.map(entry => toMotd(entry))
    message += args.join('')
  }
  if (v.extra) {
    message += v.extra.map((entry) => toMotd(entry)).join('')
  }
  return message;
}

function mcToSpan(str) {
  let child = document.createElement('span');
  let span = child;
  r = str;
  let codec = { ...codes, ...codes.color };
  delete codec.color;
  child.innerHTML = str.replace(/§[0-9a-fk-or]/g, (code, index) => {
    let classes = '';
    for (let c in codec) {
      if (c == '§r') classes = '';
      if (codec[c] == code) {
        classes = c;
      }
    }
    if (classes.length) htmlClass = ` class="${classes}"`;
    r = `<span${htmlClass}>`
    return r;
  });
  return child.innerHTML;
}

document.addEventListener('mousemove', e => [mx, my] = [e.clientX, e.clientY]);