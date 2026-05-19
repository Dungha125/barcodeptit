import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { advanceCheckPointer, fetchDisplay } from '../api';
import LeftColumn from './LeftColumn';
import RightColumn from './RightColumn';

const POLL_MS = 3000;
const ROW_LIMIT = 4;

function useAutoScroll(ref, dep) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollHeight, clientHeight } = el;
    if (scrollHeight > clientHeight) {
      el.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [dep, ref]);
}

function normalizeStart(value, totalRows) {
  const parsed = Number.parseInt(value ?? '0', 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, Math.max(0, totalRows - ROW_LIMIT));
}

export default function DisplayBoard({ enableAdvance = false, pageTitle = 'BẢNG TRÌNH CHIẾU' }) {
  const [board, setBoard] = useState({ rows: [], windowStart: 0 });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const latestLoadIdRef = useRef(0);

  const load = useCallback(async () => {
    const loadId = latestLoadIdRef.current + 1;
    latestLoadIdRef.current = loadId;

    try {
      const data = await fetchDisplay();
      if (loadId !== latestLoadIdRef.current) return;

      const incomingRows = data.rows || [];
      setBoard({
        rows: incomingRows,
        windowStart: normalizeStart(data.windowStart ?? 0, incomingRows.length),
      });
      setStatus('ok');
      setError(null);
    } catch (e) {
      if (loadId !== latestLoadIdRef.current) return;
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const { rows, windowStart } = board;
  const totalRows = rows.length;
  const visibleRows = rows.slice(windowStart, windowStart + ROW_LIMIT);
  const visibleA = visibleRows.map((row) => row.left).filter(Boolean);
  const visibleB = visibleRows.map((row) => row.right).filter(Boolean);
  const visibleAKey = visibleA.map((person) => person.id || person.ma_sv).join('|');
  const visibleBKey = visibleB.map((person) => person.id || person.ma_sv).join('|');

  const canAdvance = windowStart + 1 < totalRows;
  const advanceWindow = async () => {
    if (isAdvancing) return;
    try {
      setIsAdvancing(true);
      const result = await advanceCheckPointer();
      if (result?.advanced === false && result?.reason) {
        setError(`Không thể chuyển tiếp: ${result.reason}`);
      } else {
        setError(null);
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsAdvancing(false);
    }
  };

  useAutoScroll(leftScrollRef, visibleAKey);
  useAutoScroll(rightScrollRef, visibleBKey);

  return (
    <motion.div
      className="display-board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="display-board__top">
        <h1 className="display-board__title">{pageTitle}</h1>
        <div className="display-board__status">
          {status === 'loading' && <span>Đang kết nối API…</span>}
          {status === 'error' && <span className="display-board__status--err">{error}</span>}
          {status === 'ok' && (
            <span>
              Hàng {Math.min(totalRows, windowStart + 1)}-{Math.min(totalRows, windowStart + ROW_LIMIT)} / {totalRows}
            </span>
          )}
        </div>
      </header>

      {enableAdvance && (
        <div className="display-board__actions">
          <button
            className="display-board__next-btn"
            type="button"
            onClick={advanceWindow}
            disabled={!canAdvance || isAdvancing}
          >
            Chuyển tiếp
          </button>
        </div>
      )}

      <div className="display-board__split">
        <LeftColumn items={visibleA} listRef={leftScrollRef} />
        <div className="display-board__divider" aria-hidden />
        <RightColumn items={visibleB} listRef={rightScrollRef} />
      </div>
    </motion.div>
  );
}
