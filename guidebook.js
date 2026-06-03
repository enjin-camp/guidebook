// GAS Web App URL — Task 2完了後に実際のURLに差し替える
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxN0j3QkOfN9SXarIKJptiYRhb3ibqT8ExAykKV9MH8wqaEvvblIPZrzBxT1SaTEUHU/exec';
const AUTH_KEY = 'enjin_guidebook_auth';

const ENJIN_TYPES = {
  igniter:    { emoji: '🔥', name: '火を灯す人' },
  visionary:  { emoji: '🌍', name: '未来を描く人' },
  driver:     { emoji: '🚀', name: '動かす人' },
  cultivator: { emoji: '🌱', name: '耕す人' },
  connector:  { emoji: '🔗', name: 'つなぐ人' },
  supporter:  { emoji: '🛠️', name: '支える人' },
  observer:   { emoji: '🧭', name: '俯瞰する人' },
  seeker:     { emoji: '🫧', name: '余白を生む人' },
};

async function gasGet(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${GAS_URL}?${query}`);
  return res.json();
}

async function gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === '1';
}

function setAuthed() {
  localStorage.setItem(AUTH_KEY, '1');
}

function requireAuth() {
  if (!isAuthed()) {
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    window.location.href = 'index.html?next=' + next;
  }
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function initials(str) {
  return str ? str.charAt(0) : '?';
}

function convertDriveUrl(url) {
  if (!url) return '';
  const m1 = url.match(/\/d\/([\w-]+)/);
  if (m1) return `https://drive.google.com/thumbnail?id=${m1[1]}&sz=w400`;
  const m2 = url.match(/[?&]id=([\w-]+)/);
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w400`;
  return url;
}

function formatEnjinCount(val) {
  if (!val) return '—';
  if (val.includes('初めて')) return '初参加';
  if (val.includes('過去')) return 'リピート参加';
  return val;
}
