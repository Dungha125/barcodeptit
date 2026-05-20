import { useState } from 'react';
import { loginAdmin } from '../adminApi';

export default function AdminLogin({ onSuccess, mockMode = false }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await loginAdmin({ username, password });
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-auth">
      <form className="admin-auth__card" onSubmit={handleSubmit}>
        <h1>Đăng nhập quản trị</h1>
        <p>
          {mockMode
            ? 'Chế độ mock: nhập bất kỳ tài khoản/mật khẩu để xem trang preview.'
            : 'Vui lòng đăng nhập để truy cập trang trình chiếu chúc mừng.'}
        </p>

        <label className="admin-auth__field">
          <span>Tên đăng nhập</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="admin-auth__field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="admin-auth__error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
