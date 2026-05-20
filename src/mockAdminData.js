const DEFAULT_QUOTE =
  'Cảm ơn thầy cô, bạn bè và mái trường PTIT đã đồng hành cùng em suốt chặng đường học tập đáng nhớ!';

export const MOCK_ADMIN_TOKEN = 'mock-preview-token';

export const MOCK_SUBMISSIONS = [
  {
    id: 1,
    student_code: 'B21DCDT185',
    full_name: 'NGUYỄN VĂN QUÝ',
    major: 'Công nghệ Kỹ thuật Điện, Điện tử',
    quote: DEFAULT_QUOTE,
  },
  {
    id: 2,
    student_code: 'B21DCPT168',
    full_name: 'PHẠM XUÂN NGHỊ',
    major: 'Công nghệ thông tin',
    quote: DEFAULT_QUOTE,
  },
  {
    id: 3,
    student_code: 'B21DCTT005',
    full_name: 'PHAN VĂN TUẤN',
    major: 'Công nghệ thông tin',
    quote: DEFAULT_QUOTE,
  },
  {
    id: 4,
    student_code: 'B21DCTT216',
    full_name: 'HÀ XUÂN TRƯỜNG',
    major: 'An toàn thông tin',
    quote: DEFAULT_QUOTE,
  },
  {
    id: 5,
    student_code: 'B21DCTT189',
    full_name: 'TRẦN THỊ DIỆU HIÊN',
    major: 'Công nghệ thông tin',
    quote: DEFAULT_QUOTE,
  },
  {
    id: 6,
    student_code: 'B21DCAT089',
    full_name: 'NGUYỄN HOÀNG KHÁNH',
    major: 'Công nghệ đa phương tiện',
    quote: DEFAULT_QUOTE,
  },
];

export function getMockStudentImageUrl(studentCode) {
  const code = encodeURIComponent(String(studentCode || 'student').trim());
  return `https://picsum.photos/seed/${code}/400/600`;
}

export function getMockSubmissions() {
  return {
    success: true,
    submissions: MOCK_SUBMISSIONS,
    total: MOCK_SUBMISSIONS.length,
    mock: true,
  };
}
