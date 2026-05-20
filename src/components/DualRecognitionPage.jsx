import { useCallback, useEffect, useState } from 'react';
import { fetchAdminSubmissions } from '../adminApi';
import GraduationTemplate from './GraduationTemplate';
import '../styles/recognition.css';

const SLIDE_BACKGROUND = '/BACKLED_TỐT NGHIỆP PTIT.png';

export default function DualRecognitionPage() {
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminSubmissions();
      setSubmissions(data.submissions);
      setStatus('ok');
      setError(null);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const left = submissions[0] || null;
  const right = submissions[1] || null;

  return (
    <div
      className="recognition-page"
      style={{ backgroundImage: `url("${encodeURI(SLIDE_BACKGROUND)}")` }}
    >
      {status === 'loading' && <div className="recognition-page__overlay">Đang tải danh sách…</div>}
      {status === 'error' && (        <div className="recognition-page__overlay recognition-page__overlay--err">{error}</div>
      )}

      <div className="recognition-page__pair">
        <GraduationTemplate submission={left} empty={!left} />
        <GraduationTemplate submission={right} empty={!right} />
      </div>
    </div>
  );
}
