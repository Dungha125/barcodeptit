import { useEffect, useState } from 'react';
import { isMockMode, logoutAdmin, setAuthToken, verifyAdminSession } from '../adminApi';
import { MOCK_ADMIN_TOKEN } from '../mockAdminData';
import AdminLogin from './AdminLogin';
import '../styles/admin-auth.css';

export default function RequireAdminAuth({ children, bare = false }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const mockMode = isMockMode();

  useEffect(() => {
    if (mockMode) {
      setAuthToken(MOCK_ADMIN_TOKEN);
      setAuthed(true);
      setReady(true);
      return undefined;
    }

    let active = true;
    verifyAdminSession().then((ok) => {
      if (!active) return;
      setAuthed(ok);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [mockMode]);

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthed(false);
  };

  if (!ready) {
    return <div className="admin-auth admin-auth--loading">Đang kiểm tra phiên đăng nhập…</div>;
  }

  if (!authed) {
    return <AdminLogin mockMode={mockMode} onSuccess={() => setAuthed(true)} />;
  }

  if (bare) {
    return children;
  }

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-shell__bar">
        <span>{mockMode ? 'Chế độ mock preview' : 'Đã đăng nhập'}</span>
        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
      {children}
    </div>
  );
}
