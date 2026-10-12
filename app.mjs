import { SOURCES, STATUSES, GROUPS, lookup, filterGroups } from './data.mjs?v=20261012-3';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const badge = status => `<span class="status-badge ${status}">${STATUSES[status].label}</span>`;
let currentConsole = 'PS4';
let currentResult = null;
let tableConsole = 'all';
let expanded = false;
let toastTimer;
const featured = ['ps4-13-goldhen','ps4-current-unsupported','ps4-poops','ps4-pppwn-hen','ps5-etahen-unified','ps5-current-unsupported','ps5-1140','ps5-kstuff'];

function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('theme-toggle').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  try { localStorage.setItem('psjailbreakinfo-theme', theme); } catch {}
}
try { if (localStorage.getItem('psjailbreakinfo-theme') === 'light') setTheme('light'); } catch {}
$('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

function populateVersions() {
  const versions = [...new Set(GROUPS.filter(g => g.console === currentConsole).flatMap(g => g.versions))].sort((a,b) => Number(b) - Number(a));
  $('firmware-options').innerHTML = versions.map(v => `<option value="${v}"></option>`).join('');
}

function renderResult(result) {
  const status = STATUSES[result.status];
  currentResult = result;
  $('result').innerHTML = `<article class="result ${result.status}">
    <div class="result-top"><span class="result-icon">${icon(status.icon)}</span><div><h3>${status.title}</h3><div class="result-meta">${result.console} <span aria-hidden="true">/</span> FIRMWARE ${escape(result.version)}</div></div></div>
    <p class="result-description">${['unknown', 'unsupported'].includes(result.status) ? status.description : `<strong>${escape(result.method)}</strong>. ${result.status === 'available' ? 'A compatible route and homebrew enabler are documented.' : 'Kernel access is documented; check support for your chosen payload.'}`}</p>
    <div class="result-actions"><button class="text-link" id="result-details">View methods & requirements ${icon('arrow')}</button><button class="quiet-link" id="share-result">${icon('share')} Share result</button></div>
  </article>`;
  $('result-details').addEventListener('click', () => openDetails(currentResult));
  $('share-result').addEventListener('click', shareResult);
}

function checkFirmware(updateUrl = true) {
  const result = lookup(currentConsole, $('firmware').value);
  if (result.error) {
    $('input-error').textContent = result.error;
    $('input-error').hidden = false;
    $('firmware').setAttribute('aria-invalid', 'true');
    currentResult = null;
    $('result').innerHTML = '<div class="result dirty"><h3>Check the version format.</h3><p class="result-description">Use the system software version shown on your console.</p></div>';
    return;
  }
  $('input-error').hidden = true;
  $('firmware').removeAttribute('aria-invalid');
  $('firmware').value = result.version;
  renderResult(result);
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('console', currentConsole.toLowerCase());
    url.searchParams.set('fw', result.version);
    history.replaceState(null, '', url);
  }
}

$('checker-form').addEventListener('submit', event => { event.preventDefault(); checkFirmware(); });
document.querySelectorAll('input[name="console"]').forEach(input => input.addEventListener('change', () => {
  currentConsole = input.value;
  populateVersions();
  checkFirmware();
}));
$('firmware').addEventListener('input', () => {
  $('input-error').hidden = true;
  $('firmware').removeAttribute('aria-invalid');
  currentResult = null;
  $('result').innerHTML = `<div class="result dirty"><h3>Ready when you are.</h3><p class="result-description">Select <strong>Check firmware</strong> to see the documented options for this ${currentConsole} version.</p></div>`;
});

function showDialog(title, content, eyebrow = 'FIRMWARE DETAILS') {
  $('dialog-eyebrow').textContent = eyebrow;
  $('dialog-content').innerHTML = `<h2 class="dialog-title" id="dialog-title">${escape(title)}</h2>${content}`;
  if (!$('details-dialog').open) $('details-dialog').showModal();
}

function openDetails(record) {
  const title = `${record.console} / ${record.version || record.label}`;
  const versionList = record.versions ? `<h3 class="dialog-subtitle">Exact versions in this record</h3><div class="version-chips">${record.versions.map(v => `<button class="version-chip" data-check-version="${v}" data-check-console="${record.console}" title="Check ${record.console} ${v}">${v}</button>`).join('')}</div>` : '';
  showDialog(title, `${badge(record.status)}
    <p class="dialog-description">${escape(record.detail)}</p>
    <dl class="detail-facts"><div><dt>Entry point</dt><dd>${escape(record.entry)}</dd></div><div><dt>Homebrew payload</dt><dd>${escape(record.payload)}</dd></div>${record.console === 'PS5' ? `<div><dt>Hypervisor</dt><dd>${escape(record.hv || 'Not verified')}</dd></div>` : ''}<div><dt>Evidence checked</dt><dd>12 October 2026</dd></div></dl>
    <h3 class="dialog-subtitle">${record.status === 'unsupported' ? 'Current availability' : 'What this route needs'}</h3><p class="dialog-description">${escape(record.requirement)}</p>
    ${versionList}
    <h3 class="dialog-subtitle">Check the original sources</h3><div class="dialog-sources">${record.sources.map(key => `<a href="${SOURCES[key].url}" target="_blank" rel="noopener noreferrer">${escape(SOURCES[key].name)} ${icon('external')}</a>`).join('')}</div>
    <p class="dialog-foot">Based on project documentation, not a hands-on test. A listed route does not guarantee every feature or a successful attempt.</p>`);
}

function openFirmwareHelp() {
  showDialog('Find your firmware.', `<p class="dialog-description">Use the version installed on your console, not the version of a game or controller.</p><div class="help-step"><strong>PlayStation 4</strong><p>Settings → System → System Information<br>Look for <strong>System Software</strong>, for example 11.00.</p></div><div class="help-step"><strong>PlayStation 5</strong><p>Settings → System → System Software → Console Information<br>Look for <strong>System Software</strong>. You can paste the full version here; for example, 25.02-11.00.00.07 becomes 11.00.</p></div><p class="dialog-foot">The checker reads the number you enter. It does not connect to or detect your console.</p>`, 'QUICK HELP');
}
$('firmware-help').addEventListener('click', openFirmwareHelp);
$('learn-firmware-help').addEventListener('click', openFirmwareHelp);
$('close-dialog').addEventListener('click', () => $('details-dialog').close());
$('details-dialog').addEventListener('click', event => {
  if (event.target !== $('details-dialog')) return;
  const rect = $('details-dialog').getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('details-dialog').close();
});
$('dialog-content').addEventListener('click', event => {
  const button = event.target.closest('[data-check-version]');
  if (!button) return;
  currentConsole = button.dataset.checkConsole;
  document.querySelector(`input[name="console"][value="${currentConsole}"]`).checked = true;
  $('firmware').value = button.dataset.checkVersion;
  populateVersions();
  checkFirmware();
  $('details-dialog').close();
  $('checker').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  $('firmware').focus({ preventScroll: true });
});

async function shareResult() {
  if (!currentResult) return;
  const url = new URL(location.href);
  url.search = '';
  url.hash = 'checker';
  url.searchParams.set('console', currentResult.console.toLowerCase());
  url.searchParams.set('fw', currentResult.version);
  try {
    await navigator.clipboard.writeText(url.href);
    notify('Result link copied. Ready to share.');
  } catch {
    showDialog('Share this result.', `<p class="dialog-description">Copy this link to open the same console and firmware check.</p><label class="sr-only" for="share-url">Result link</label><input id="share-url" class="share-input" readonly value="${escape(url.href)}">`, 'SHARE RESULT');
    $('share-url').select();
  }
}

function renderTable() {
  const query = $('table-search').value;
  const status = $('status-filter').value;
  let records = filterGroups(tableConsole, query, status);
  const isOverview = tableConsole === 'all' && !query.trim() && status === 'all';
  if (isOverview) {
    records.sort((a,b) => {
      const ai = featured.indexOf(a.id), bi = featured.indexOf(b.id);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  } else records.sort((a,b) => Math.max(...b.versions.map(Number)) - Math.max(...a.versions.map(Number)));
  const visible = expanded ? records : records.slice(0,8);
  $('firmware-table').innerHTML = visible.map(g => `<tr><td><div class="firmware-cell"><span class="console-tag ${g.console === 'PS5' ? 'purple' : ''}">${g.console}</span><span><span class="version-label">${escape(g.label)}</span><span class="version-sub">${g.versions.length === 1 ? 'Exact firmware' : `${g.versions.length} exact versions · see details`}</span></span></div></td><td>${badge(g.status)}</td><td class="method-cell">${escape(g.method)}</td><td>${escape(g.entry)}</td><td><button class="row-details" data-record="${g.id}" aria-label="View ${g.console} ${escape(g.label)} details">${icon('arrow')}</button></td></tr>`).join('');
  $('empty-state').hidden = records.length !== 0;
  $('table-count').textContent = `Showing ${visible.length} of ${records.length} firmware groups`;
  $('show-more').hidden = records.length <= 8;
  $('show-more').innerHTML = `${expanded ? 'Show fewer records' : `Show all ${records.length} records`} ${icon('chevron')}`;
  $('show-more').setAttribute('aria-expanded', String(expanded));
}
function chooseTableConsole(value) {
  tableConsole = value;
  expanded = false;
  document.querySelectorAll('[data-console-filter]').forEach(button => {
    const selected = button.dataset.consoleFilter === value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderTable();
}
document.querySelectorAll('[data-console-filter]').forEach(button => button.addEventListener('click', () => chooseTableConsole(button.dataset.consoleFilter)));
document.querySelectorAll('[data-quick]').forEach(button => button.addEventListener('click', () => {
  $('table-search').value = '';
  $('status-filter').value = 'all';
  chooseTableConsole(button.dataset.quick);
  $('database').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}));
$('table-search').addEventListener('input', () => { expanded = false; renderTable(); });
$('status-filter').addEventListener('change', () => { expanded = false; renderTable(); });
$('show-more').addEventListener('click', () => { expanded = !expanded; renderTable(); });
$('reset-filters').addEventListener('click', () => { $('table-search').value = ''; $('status-filter').value = 'all'; chooseTableConsole('all'); });
$('firmware-table').addEventListener('click', event => {
  const button = event.target.closest('[data-record]');
  if (button) openDetails(GROUPS.find(g => g.id === button.dataset.record));
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !$('details-dialog').open && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault();
    $('table-search').focus();
  }
});

const primarySources = ['goldhen','pppwn','henloader','rawgame','ps5hen','umtx','etahen','relapse'];
$('source-grid').innerHTML = primarySources.map(key => {
  const source = SOURCES[key];
  return `<a class="source-card" href="${source.url}" target="_blank" rel="noopener noreferrer"><small>${source.console} / PROJECT DOCUMENTATION</small><strong>${escape(source.name)}</strong>${icon('external')}<p>${escape(source.description)}</p><span>${escape(source.author)}</span></a>`;
}).join('');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  ['checker','database','learn','sources'].forEach(id => observer.observe($(id)));
}

const params = new URLSearchParams(location.search);
if (params.get('console')?.toLowerCase() === 'ps5') currentConsole = 'PS5';
document.querySelector(`input[name="console"][value="${currentConsole}"]`).checked = true;
if (params.has('fw')) $('firmware').value = params.get('fw').slice(0,60);
else if (currentConsole === 'PS5') $('firmware').value = '4.51';
populateVersions();
checkFirmware(false);
renderTable();
