import { useEffect, useState } from 'react';
import DisplayBoard from './components/DisplayBoard';
import DualRecognitionPage from './components/DualRecognitionPage';
import RequireAdminAuth from './components/RequireAdminAuth';

function normalizePath(pathname) {
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned || '/';
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const isCheckin = path === '/checkin';
  const isSlide = path === '/slide';

  if (isSlide) {
    return (
      <RequireAdminAuth bare>
        <DualRecognitionPage />
      </RequireAdminAuth>
    );
  }

  return <DisplayBoard enableAdvance={isCheckin} pageTitle={isCheckin ? 'BẢNG CHECKIN' : 'BẢNG TRÌNH CHIẾU'} />;
}
