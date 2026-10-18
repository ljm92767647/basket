const board = document.getElementById('board');
const dialog = document.getElementById('player-dialog');
const cards = new Map();
const galleryObservers = [];
const mobile = matchMedia('(max-width: 800px)');
let mode = 'roles';

const allRefs = new Set(DATA.roles.flatMap(row => row.images));
for (const ref of allRefs) {
  const player = DATA.jerseys[ref];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'jersey';
  button.setAttribute('aria-label', player.name + ' 선수 능력 설명 열기');
  const art = document.createElement('div');
  art.className = 'uniform-art' + (Number(ref) === 28 ? ' is-nash' : '');
  const image = document.createElement('img');
  image.src = player.src;
  image.alt = player.name + ' 백넘버 유니폼';
  art.append(image);
  const caption = document.createElement('div');
  caption.className = 'card-caption';
  const role = document.createElement('span');
  role.className = 'card-role';
  const name = document.createElement('span');
  name.className = 'card-name';
  name.textContent = player.name;
  caption.append(role, name);
  button.append(art, caption);
  button.addEventListener('click', () => showPlayer(player, ref));
  cards.set(ref, button);
}

function showPlayer(player, ref) {
  document.querySelector('.player-visual').style.setProperty('--kit-color', player.color || '#576c90');
  const image = document.getElementById('selected-uniform');
  image.src = player.src;
  image.alt = player.name + ' 유니폼';
  image.parentElement.classList.toggle('is-nash', Number(ref) === 28);
  document.getElementById('selected-name').textContent = player.name;
  document.getElementById('selected-skills').replaceChildren(
    document.getElementById(player.target).querySelector('.player-copy').cloneNode(true)
  );
  dialog.showModal();
}

function attachSlider(viewport, content, title) {
  const rail = document.createElement('div');
  rail.className = 'scroll-control';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0'; range.max = '1000'; range.step = '1'; range.value = '0';
  range.setAttribute('aria-label', title + ' 좌우 이동');
  rail.append(range); viewport.after(rail);
  let extent = 0;
  function sync() {
    extent = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    rail.hidden = extent < 2;
    range.value = extent ? String(Math.round(viewport.scrollLeft / extent * 1000)) : '0';
  }
  range.addEventListener('input', () => { viewport.scrollLeft = Number(range.value) / 1000 * extent; });
  viewport.addEventListener('scroll', sync, { passive: true });
  const observer = new ResizeObserver(sync);
  observer.observe(viewport); observer.observe(content);
  galleryObservers.push(observer); sync();
}

function arrange() {
  galleryObservers.splice(0).forEach(observer => observer.disconnect());
  const previous = new Map([...cards].map(([ref, card]) => [ref, card.getBoundingClientRect()]));
  board.replaceChildren();
  board.className = 'single' + (mode === 'signature' ? ' signature' : '');
  const placed = new Set();
  for (const row of DATA[mode]) {
    const refs = row.images.filter(ref => allRefs.has(ref) && !placed.has(ref));
    if (!refs.length) continue;
    const section = document.createElement('section');
    section.className = 'uniform-group' + (row.compact ? ' compact' : '');
    const title = document.createElement('h3');
    title.className = 'row-label'; title.textContent = row.title;
    const viewport = document.createElement('div');
    viewport.className = 'gallery-viewport';
    const grid = document.createElement('div'); grid.className = 'uniform-grid';
    grid.style.setProperty('--count', refs.length);
    refs.forEach((ref, index) => {
      placed.add(ref);
      const card = cards.get(ref);
      const role = card.querySelector('.card-role');
      role.textContent = ['슈터', '공수겸장', '핸들러'][index] || '스킬러';
      role.hidden = mode !== 'roles';
      grid.append(card);
    });
    viewport.append(grid); section.append(title, viewport); board.append(section);
    if (!mobile.matches) attachSlider(viewport, grid, row.title);
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const [ref, card] of cards) {
      const old = previous.get(ref), next = card.getBoundingClientRect();
      if (old.width && card.isConnected) card.animate([
        { transform: `translate(${old.x - next.x}px,${old.y - next.y}px)` },
        { transform: 'translate(0,0)' }
      ], { duration: 400, easing: 'cubic-bezier(.22,.7,.3,1)' });
    }
  }
}

function select(next) {
  mode = next;
  document.getElementById('default-mode').setAttribute('aria-pressed', String(mode === 'roles'));
  document.getElementById('signature-mode').setAttribute('aria-pressed', String(mode === 'signature'));
  arrange();
}
document.getElementById('default-mode').addEventListener('click', () => select('roles'));
document.getElementById('signature-mode').addEventListener('click', () => select('signature'));
mobile.addEventListener('change', arrange);
document.getElementById('close-player').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
const toggle = document.getElementById('toggle-notes');
toggle.addEventListener('click', () => {
  const notes = [...document.querySelectorAll('.player-note')];
  const open = notes.some(note => !note.open);
  notes.forEach(note => { note.open = open; });
  toggle.textContent = open ? '모두 접기' : '모두 펼치기';
});
arrange();

const teamGroups = document.querySelector('.club-groups');
function setLogoMetrics(element, ref) {
  const metric = DATA.logoMetrics[ref];
  for (const property of ['width', 'height', 'x', 'y']) {
    element.style.setProperty('--logo-' + property, metric[property] + (['x', 'y'].includes(property) ? '%' : ''));
  }
}
function showTeams(sport) {
  teamGroups.replaceChildren();
  for (const row of DATA.teams[sport]) {
    const section = document.createElement('div'); section.className = 'club-group';
    const label = document.createElement('div'); label.className = 'club-label';
    const title = document.createElement('h2'); title.textContent = row.title;
    const description = document.createElement('p'); description.textContent = row.description;
    label.append(title, description);
    const emblems = document.createElement('div'); emblems.className = 'emblems';
    for (const ref of row.images) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'emblem';
      button.setAttribute('aria-label', DATA.teamNames[ref] + ' 팀 크게 보기');
      setLogoMetrics(button, ref);
      const image = document.createElement('img');
      image.src = 'assets/' + ref + '.webp'; image.alt = DATA.teamNames[ref];
      button.append(image); button.addEventListener('click', () => showTeam(ref));
      emblems.append(button);
    }
    section.append(label, emblems); teamGroups.append(section);
  }
  for (const button of document.querySelectorAll('[data-sport]')) {
    button.setAttribute('aria-pressed', String(button.dataset.sport === sport));
  }
}
const teamDialog = document.getElementById('team-dialog');
function showTeam(ref) {
  const name = DATA.teamNames[ref], cap = DATA.capLogos[String(ref)];
  teamDialog.classList.toggle('has-cap', Boolean(cap));
  document.getElementById('selected-team-name').textContent = name;
  const crest = document.getElementById('team-crest'); setLogoMetrics(crest, ref);
  const logo = document.getElementById('selected-team-logo');
  logo.src = 'assets/' + ref + '.webp'; logo.alt = name + ' 풀 로고';
  const panel = document.getElementById('team-cap-panel'); panel.hidden = !cap;
  const capImage = document.getElementById('selected-team-cap');
  if (cap) { capImage.src = 'assets/' + cap + '.webp'; capImage.alt = name + ' 모자 약자 로고'; }
  else { capImage.removeAttribute('src'); capImage.alt = ''; }
  teamDialog.showModal();
}
document.getElementById('close-team').addEventListener('click', () => teamDialog.close());
teamDialog.addEventListener('click', event => { if (event.target === teamDialog) teamDialog.close(); });
for (const button of document.querySelectorAll('[data-sport]')) button.addEventListener('click', () => showTeams(button.dataset.sport));
showTeams('NBA');
