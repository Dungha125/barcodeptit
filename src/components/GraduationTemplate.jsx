import { getStudentImageUrl } from '../adminApi';

export default function GraduationTemplate({ submission, empty = false }) {
  if (empty || !submission) {
    return (
      <article className="grad-template grad-template--empty" aria-hidden>
        <div className="grad-template__frame">
          <div className="grad-template__photo" />
          <div className="grad-template__info">
            <p className="grad-template__placeholder">Chưa có dữ liệu</p>
          </div>
        </div>
      </article>
    );
  }

  const studentCode = submission.student_code || submission.ma_sv || '';
  const fullName = submission.full_name || submission.ho_ten || '—';
  const major = submission.major || submission.nganh || '';
  const quote =
    submission.quote ||
    'Cảm ơn thầy cô, bạn bè và mái trường PTIT đã đồng hành cùng em suốt chặng đường học tập đáng nhớ!';

  return (
    <article className="grad-template">
      <div className="grad-template__frame">
        <div className="grad-template__photo">
          <img
            src={getStudentImageUrl(studentCode)}
            alt={fullName}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="grad-template__info">
          <p className="grad-template__congrats">Chúc mừng Tân kỹ sư</p>
          <h2 className="grad-template__name">{fullName}</h2>
          <p className="grad-template__code">{studentCode}</p>
          {major && <p className="grad-template__major">Ngành: {major}</p>}
          <p className="grad-template__quote" lang="vi">{quote}</p>
        </div>
      </div>
    </article>
  );
}
