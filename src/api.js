const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1Po1O8Dk3MmTATy9NZo6-NA5SUHiuOjvECo1u37EDYZQ';
const SHEET_GID = import.meta.env.VITE_SHEET_GID || '0';
const SHEET_QUERY_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
const DEFAULT_WRITE_API_BASE =
  typeof window === 'undefined'
    ? 'http://127.0.0.1:8000'
    : import.meta.env.DEV
      ? `http://${window.location.hostname}:8000`
      : window.location.origin;
const WRITE_API_BASE = import.meta.env.VITE_WRITE_API_URL || DEFAULT_WRITE_API_BASE;

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { ho_dem: '', ten: '' };
  if (parts.length === 1) return { ho_dem: '', ten: parts[0] };
  return {
    ho_dem: parts.slice(0, -1).join(' '),
    ten: parts[parts.length - 1],
  };
}

function normalizeAvatar(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  return /^https?:\/\//i.test(text) ? text : null;
}

function buildItem({ group, hoTen, maSV, xepLoai, avatar, rowIndex }) {
  const { ho_dem, ten } = splitName(hoTen);
  return {
    id: `${group}-${maSV || rowIndex}`,
    ma_sv: String(maSV || '').trim(),
    ho_ten: String(hoTen || '').trim(),
    ho_dem,
    ten,
    ngay_sinh: '',
    noi_sinh: '',
    dtbc: '',
    xep_loai: String(xepLoai || '').trim(),
    lop: '',
    nganh: '',
    group,
    avatar_url: normalizeAvatar(avatar),
  };
}

function getCell(row, index) {
  const cell = row?.c?.[index];
  return cell?.v ?? cell?.f ?? '';
}

function rowHasDisplayData(row) {
  for (let i = 0; i < 8; i += 1) {
    if (String(getCell(row, i) || '').trim()) return true;
  }
  return false;
}

function parseGvizText(rawText) {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('});');
  if (start < 0 || end < 0) throw new Error('Không parse được dữ liệu Google Sheet');
  return JSON.parse(rawText.slice(start, end + 1));
}

function normalizeBoardDataFromSheet(gvizPayload) {
  const allRows = gvizPayload?.table?.rows || [];
  const rows = allRows.slice(1); // bỏ header/title
  const boardRows = [];

  rows.forEach((row, idx) => {
    if (!rowHasDisplayData(row)) return;
    const hoTenA = getCell(row, 0);
    const maSVA = getCell(row, 1);
    const xepLoaiA = getCell(row, 2);
    const avatarA = getCell(row, 3);

    const hoTenB = getCell(row, 4);
    const maSVB = getCell(row, 5);
    const xepLoaiB = getCell(row, 6);
    const avatarB = getCell(row, 7);

    const left =
      [hoTenA, maSVA, xepLoaiA, avatarA].some((v) => String(v || '').trim())
        ? buildItem({
            group: 'A',
            hoTen: hoTenA,
            maSV: maSVA,
            xepLoai: xepLoaiA,
            avatar: avatarA,
            rowIndex: idx + 3,
          })
        : null;

    const right =
      [hoTenB, maSVB, xepLoaiB, avatarB].some((v) => String(v || '').trim())
        ? buildItem({
            group: 'B',
            hoTen: hoTenB,
            maSV: maSVB,
            xepLoai: xepLoaiB,
            avatar: avatarB,
            rowIndex: idx + 3,
          })
        : null;

    boardRows.push({ left, right });
  });

  const markerRawIndex = rows.findIndex(
    (row) => String(getCell(row, 8) || '').trim().toLowerCase() === 'x'
  );

  let windowStart = 0;
  if (markerRawIndex >= 0) {
    let countDataRows = 0;
    for (let i = 0; i <= markerRawIndex; i += 1) {
      if (rowHasDisplayData(rows[i])) countDataRows += 1;
    }
    windowStart = Math.max(0, countDataRows - 1);
  }

  windowStart = Math.min(windowStart, Math.max(0, boardRows.length - 1));

  return {
    success: true,
    rows: boardRows,
    windowStart,
    total: boardRows.length,
  };
}

export async function fetchDisplay() {
  const res = await fetch(SHEET_QUERY_URL);
  if (!res.ok) {
    throw new Error(`Sheet API: ${res.status}`);
  }
  const rawText = await res.text();
  const gvizPayload = parseGvizText(rawText);
  return normalizeBoardDataFromSheet(gvizPayload);
}

export async function advanceCheckPointer() {
  const res = await fetch(`${WRITE_API_BASE}/api/sheet/advance`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Advance API: ${res.status}`);
  }
  return res.json();
}
