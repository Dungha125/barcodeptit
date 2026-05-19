const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1Po1O8Dk3MmTATy9NZo6-NA5SUHiuOjvECo1u37EDYZQ';
const SHEET_GID = import.meta.env.VITE_SHEET_GID || '0';
const SHEET_QUERY_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

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

function parseGvizText(rawText) {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('});');
  if (start < 0 || end < 0) throw new Error('Không parse được dữ liệu Google Sheet');
  return JSON.parse(rawText.slice(start, end + 1));
}

function normalizeBoardDataFromSheet(gvizPayload) {
  const rows = gvizPayload?.table?.rows || [];
  const groupA = [];
  const groupB = [];

  rows.forEach((row, idx) => {
    const hoTenA = getCell(row, 0);
    const maSVA = getCell(row, 1);
    const xepLoaiA = getCell(row, 2);
    const avatarA = getCell(row, 3);

    const hoTenB = getCell(row, 4);
    const maSVB = getCell(row, 5);
    const xepLoaiB = getCell(row, 6);
    const avatarB = getCell(row, 7);

    if ([hoTenA, maSVA, xepLoaiA, avatarA].some((v) => String(v || '').trim())) {
      groupA.push(buildItem({ group: 'A', hoTen: hoTenA, maSV: maSVA, xepLoai: xepLoaiA, avatar: avatarA, rowIndex: idx + 2 }));
    }

    if ([hoTenB, maSVB, xepLoaiB, avatarB].some((v) => String(v || '').trim())) {
      groupB.push(buildItem({ group: 'B', hoTen: hoTenB, maSV: maSVB, xepLoai: xepLoaiB, avatar: avatarB, rowIndex: idx + 2 }));
    }
  });

  return {
    success: true,
    groupA,
    groupB,
    total: Math.max(groupA.length, groupB.length),
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
