// ===== Storage Functions =====
let store = {};
let currentPeriod = '';
let lastDeleted = null;

function loadStore(){ try{ const raw = localStorage.getItem(STORAGE_KEY); store = raw ? JSON.parse(raw) : {}; }catch(e){ store={}; } }
function saveStore(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
function ensurePeriod(p){ if(!store[p]) store[p] = { budget:0, added:0, expenses:[], income:[] }; }