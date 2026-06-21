// Time parsing and utility functions

export const QUARTERS = [
  { value: 1, label: 'Q1' },
  { value: 2, label: 'Q2' },
  { value: 3, label: 'Q3' },
  { value: 4, label: 'Q4' },
];

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));

export const YEARS = Array.from({ length: 10 }, (_, i) => ({
  value: 2024 + i,
  label: `${2024 + i}`,
}));

export function getQuarterFromMonth(month) {
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  if (month >= 10 && month <= 12) return 4;
  return null;
}

export function parseTimeString(raw) {
  if (!raw || typeof raw !== 'string') return { quy: null, thang: null, nam: null, warning: true };

  const cleaned = raw.trim().toLowerCase();
  let quy = null, thang = null, nam = null;

  // Pattern: Q1.2026, Q1/2026, Q1-2026, Q1 2026
  const qPattern = /q(\d)[.\-\/\s]*(\d{4})/i;
  const qMatch = cleaned.match(qPattern);
  if (qMatch) {
    quy = parseInt(qMatch[1]);
    nam = parseInt(qMatch[2]);
    if (quy >= 1 && quy <= 4 && nam >= 2000 && nam <= 2100) {
      return { quy, thang: null, nam, warning: false };
    }
  }

  // Pattern: Quy1.2026, Quy 1/2026
  const quyPattern = /qu[yý]\s*(\d)[.\-\/\s]*(\d{4})/i;
  const quyMatch = cleaned.match(quyPattern);
  if (quyMatch) {
    quy = parseInt(quyMatch[1]);
    nam = parseInt(quyMatch[2]);
    if (quy >= 1 && quy <= 4 && nam >= 2000 && nam <= 2100) {
      return { quy, thang: null, nam, warning: false };
    }
  }

  // Pattern: Thang 1/2026, Tháng 1.2026, T1/2026
  const thangPattern = /(?:th[aá]ng\s*|t)(\d{1,2})[.\-\/\s]*(\d{4})/i;
  const thangMatch = cleaned.match(thangPattern);
  if (thangMatch) {
    thang = parseInt(thangMatch[1]);
    nam = parseInt(thangMatch[2]);
    if (thang >= 1 && thang <= 12 && nam >= 2000 && nam <= 2100) {
      quy = getQuarterFromMonth(thang);
      return { quy, thang, nam, warning: false };
    }
  }

  // Pattern: 1/2026, 01/2026, 1.2026
  const simplePattern = /^(\d{1,2})[.\-\/](\d{4})$/;
  const simpleMatch = cleaned.match(simplePattern);
  if (simpleMatch) {
    thang = parseInt(simpleMatch[1]);
    nam = parseInt(simpleMatch[2]);
    if (thang >= 1 && thang <= 12 && nam >= 2000 && nam <= 2100) {
      quy = getQuarterFromMonth(thang);
      return { quy, thang, nam, warning: false };
    }
  }

  // Pattern: just a year like 2026
  const yearPattern = /^(\d{4})$/;
  const yearMatch = cleaned.match(yearPattern);
  if (yearMatch) {
    nam = parseInt(yearMatch[1]);
    if (nam >= 2000 && nam <= 2100) {
      return { quy: null, thang: null, nam, warning: false };
    }
  }

  return { quy: null, thang: null, nam: null, warning: true, rawText: raw };
}

export function formatTimeDisplay(good) {
  const parts = [];
  if (good.quy) parts.push(`Q${good.quy}`);
  if (good.thang) parts.push(`T${good.thang}`);
  if (good.nam) parts.push(good.nam);
  return parts.length > 0 ? parts.join('.') : '—';
}