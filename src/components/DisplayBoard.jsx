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
  return Math.min(parsed, Math.max(0, totalRows - 1));
}

export default function DisplayBoard({ enableAdvance = false, pageTitle = 'BẢNG TRÌNH CHIẾU' }) {
  const [board, setBoard] = useState({ rows: [], windowStart: 0, total: 0, hasNext: false });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const latestLoadIdRef = useRef(0);
  const lastBoardKeyRef = useRef('');

  const load = useCallback(async () => {
    const loadId = latestLoadIdRef.current + 1;
    latestLoadIdRef.current = loadId;

    try {
      const data = await fetchDisplay({ limit: ROW_LIMIT });
      if (loadId !== latestLoadIdRef.current) return;

      const incomingRows = Array.isArray(data?.rows) ? data.rows : [];
      const total = Math.max(
        incomingRows.length,
        Number.parseInt(data?.total ?? '0', 10) || incomingRows.length
      );
      const windowStart = normalizeStart(data?.windowStart ?? 0, total);
      const hasNext = Boolean(
        data?.hasNext ?? (windowStart + incomingRows.length < total)
      );
      const boardKey = `${windowStart}|${total}|${hasNext ? 1 : 0}|${incomingRows
        .map((row) => `${row.sheet_row || ''}:${row.left?.id || '-'}:${row.right?.id || '-'}`)
        .join('|')}`;

      if (boardKey !== lastBoardKeyRef.current) {
        lastBoardKeyRef.current = boardKey;
        setBoard({
          rows: incomingRows,
          windowStart,
          total,
          hasNext,
        });
      }
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

  const { rows: visibleRows, windowStart, total: totalRows, hasNext } = board;
  const visibleA = visibleRows.map((row) => row.left).filter(Boolean);
  const visibleB = visibleRows.map((row) => row.right).filter(Boolean);
  const visibleAKey = visibleA.map((person) => person.id || person.ma_sv).join('|');
  const visibleBKey = visibleB.map((person) => person.id || person.ma_sv).join('|');

  const canAdvance = hasNext;
  const advanceWindow = useCallback(async () => {
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
  }, [isAdvancing, load]);

  useEffect(() => {
    if (!enableAdvance) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== 'Enter' && event.key !== 'NumpadEnter') return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        if (
          target.isContentEditable ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return;
        }
      }

      if (!canAdvance || isAdvancing) return;
      event.preventDefault();
      void advanceWindow();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advanceWindow, canAdvance, enableAdvance, isAdvancing]);

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
              Hàng {Math.min(totalRows, windowStart + 1)}-{Math.min(totalRows, windowStart + Math.max(visibleRows.length, 1))} / {totalRows}
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
            aria-keyshortcuts="Enter"
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
