import { useEffect, useState } from 'react';
import DisplayBoard from './components/DisplayBoard';

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
  return <DisplayBoard enableAdvance={isCheckin} pageTitle={isCheckin ? 'BẢNG CHECKIN' : 'BẢNG TRÌNH CHIẾU'} />;
}
