const SHEET_ID =
  import.meta.env.VITE_SHEET_ID || '1Po1O8Dk3MmTATy9NZo6-NA5SUHiuOjvECo1u37EDYZQ';
const SHEET_GID = import.meta.env.VITE_SHEET_GID || '0';
const SHEET_RANGE = import.meta.env.VITE_SHEET_RANGE || 'A:H';

function buildSheetUrl() {
  const tqx = encodeURIComponent('out:json');
  const range = encodeURIComponent(SHEET_RANGE);
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&range=${range}&headers=1&tqx=${tqx}`;
}

function parseGoogleVisualizationJson(rawText) {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      'Không đọc được dữ liệu Sheet. Hãy Publish sheet hoặc bật quyền "Anyone with the link".'
    );
  }
  return JSON.parse(rawText.slice(start, end + 1));
}

function cellValue(row, index) {
  return row?.c?.[index]?.v ?? '';
}

function normalizeAvatar(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:image/')) {
    return v;
  }
  return null;
}

function mapRowToPerson(row, rowIndex, group, startCol) {
  const hoTen = String(cellValue(row, startCol)).trim();
  const maSv = String(cellValue(row, startCol + 1)).trim();
  const xepLoai = String(cellValue(row, startCol + 2)).trim();
  const avatarRaw = String(cellValue(row, startCol + 3)).trim();

  if (!hoTen && !maSv) return null;

  return {
    id: `${group}-${maSv || rowIndex + 2}`,
    ma_sv: maSv,
    ho_ten: hoTen,
    xep_loai: xepLoai,
    nganh: '',
    lop: '',
    group,
    avatar_url: normalizeAvatar(avatarRaw),
    avatar_path: avatarRaw,
  };
}

export async function fetchDisplay() {
  const res = await fetch(buildSheetUrl());
  if (!res.ok) throw new Error(`Sheet API: ${res.status}`);

  const rawText = await res.text();
  const parsed = parseGoogleVisualizationJson(rawText);
  const rows = parsed?.table?.rows || [];

  const groupA = [];
  const groupB = [];

  rows.forEach((row, rowIndex) => {
    const left = mapRowToPerson(row, rowIndex, 'A', 0);
    const right = mapRowToPerson(row, rowIndex, 'B', 4);
    if (left) groupA.push(left);
    if (right) groupB.push(right);
  });

  return {
    success: true,
    groupA,
    groupB,
    total: groupA.length + groupB.length,
  };
}
