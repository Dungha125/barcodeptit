const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function toDisplayItem(student, group = 'A') {
  if (!student) return null;
  return {
    id: student.ma_sv || `${group}-${Date.now()}`,
    ma_sv: student.ma_sv || '',
    ho_ten: `${student.ho_dem || ''} ${student.ten || ''}`.trim(),
    ho_dem: student.ho_dem || '',
    ten: student.ten || '',
    ngay_sinh: student.ngay_sinh || '',
    noi_sinh: student.noi_sinh || '',
    dtbc: student.dtbc || '',
    xep_loai: student.xep_loai || '',
    lop: student.lop || '',
    nganh: student.nganh || '',
    group,
    avatar_url: null,
  };
}

function normalizeBoardData(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, groupA: [], groupB: [], total: 0 };
  }

  if (Array.isArray(payload.groupA) || Array.isArray(payload.groupB)) {
    const groupA = Array.isArray(payload.groupA) ? payload.groupA : [];
    const groupB = Array.isArray(payload.groupB) ? payload.groupB : [];
    return {
      ...payload,
      groupA,
      groupB,
      total: typeof payload.total === 'number' ? payload.total : groupA.length + groupB.length,
    };
  }

  if (payload.display) {
    const item = payload.display;
    return {
      success: !!payload.success,
      groupA: item.group === 'A' ? [item] : [],
      groupB: item.group === 'B' ? [item] : [],
      total: 1,
    };
  }

  if (payload.student) {
    const item = toDisplayItem(payload.student, 'A');
    return { success: !!payload.success, groupA: item ? [item] : [], groupB: [], total: item ? 1 : 0 };
  }

  return { success: !!payload.success, groupA: [], groupB: [], total: 0 };
}

export async function fetchDisplay() {
  const res = await fetch(`${API_BASE}/api/display`);
  if (!res.ok) throw new Error(`Display API: ${res.status}`);
  const data = await res.json();
  return normalizeBoardData(data);
}
