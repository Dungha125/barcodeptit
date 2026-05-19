import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { advanceCheckPointer, fetchDisplay } from '../api';
import LeftColumn from './LeftColumn';
import RightColumn from './RightColumn';

const POLL_MS = 3000;
const ROW_LIMIT = 4;
const PREFETCH_ROWS = 2;

function rowKey(row) {
  return `${row.sheet_row || ''}:${row.left?.id || '-'}:${row.right?.id || '-'}`;
}

function dedupeRows(existing, incoming) {
  const seen = new Set(existing.map(rowKey));
  return incoming.filter((row) => {
    const key = rowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shiftBoardByOne(prev) {
  const combined = [...prev.rows, ...prev.prefetchedRows];
  if (combined.length <= 1) return prev;

  const rows = combined.slice(1, 1 + ROW_LIMIT);
  const prefetchedRows = combined.slice(1 + ROW_LIMIT);
  const windowStart = prev.windowStart + 1;

  return {
    ...prev,
    rows,
    prefetchedRows,
    windowStart,
    hasNext: windowStart + rows.length < prev.total || prefetchedRows.length > 0,
  };
}

export default function DisplayBoard({ enableAdvance = false, pageTitle = 'BẢNG TRÌNH CHIẾU' }) {
  const [board, setBoard] = useState({
    rows: [],
    prefetchedRows: [],
    windowStart: 0,
    total: 0,
    hasNext: false,
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const boardRef = useRef(board);
  const latestLoadIdRef = useRef(0);
  const lastVisibleKeyRef = useRef('');

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const appendPrefetch = useCallback(async (loadId) => {
    const current = boardRef.current;
    const skip = ROW_LIMIT + current.prefetchedRows.length;
    const data = await fetchDisplay({ limit: PREFETCH_ROWS, skip });
    if (loadId !== latestLoadIdRef.current) return;

    const incoming = Array.isArray(data?.rows) ? data.rows : [];
    const extra = dedupeRows(current.prefetchedRows, incoming);
    if (extra.length === 0) return;

    setBoard((prev) => ({
      ...prev,
      prefetchedRows: [...prev.prefetchedRows, ...extra],
      total: Math.max(prev.total, Number.parseInt(data?.total ?? '0', 10) || prev.total),
      hasNext:
        Boolean(data?.hasNext) ||
        prev.windowStart + prev.rows.length < prev.total ||
        prev.prefetchedRows.length + extra.length > 0,
    }));
  }, []);

  const syncVisible = useCallback(async (loadId) => {
    const data = await fetchDisplay({ limit: ROW_LIMIT, skip: 0 });
    if (loadId !== latestLoadIdRef.current) return null;

    const rows = Array.isArray(data?.rows) ? data.rows : [];
    const total = Number.parseInt(data?.total ?? '0', 10) || rows.length;
    const windowStart = Number.parseInt(data?.windowStart ?? '0', 10) || 0;
    const visibleKey = `${windowStart}|${total}|${rows.map(rowKey).join('|')}`;

    if (visibleKey !== lastVisibleKeyRef.current) {
      lastVisibleKeyRef.current = visibleKey;
      setBoard((prev) => ({
        ...prev,
        rows,
        windowStart,
        total,
        hasNext:
          Boolean(data?.hasNext) ||
          windowStart + rows.length < total ||
          prev.prefetchedRows.length > 0,
      }));
    }

    return { rows, total, windowStart };
  }, []);

  const load = useCallback(async () => {
    const loadId = latestLoadIdRef.current + 1;
    latestLoadIdRef.current = loadId;

    try {
      const visible = await syncVisible(loadId);
      if (!visible) return;

      if (boardRef.current.prefetchedRows.length === 0) {
        const prefetchData = await fetchDisplay({ limit: PREFETCH_ROWS, skip: ROW_LIMIT });
        if (loadId !== latestLoadIdRef.current) return;

        const prefetchedRows = Array.isArray(prefetchData?.rows) ? prefetchData.rows : [];
        setBoard((prev) => ({
          ...prev,
          prefetchedRows,
          total: Math.max(prev.total, Number.parseInt(prefetchData?.total ?? '0', 10) || prev.total),
          hasNext:
            Boolean(prefetchData?.hasNext) ||
            prev.windowStart + prev.rows.length < prev.total ||
            prefetchedRows.length > 0,
        }));
      }

      setStatus('ok');
      setError(null);
    } catch (e) {
      if (loadId !== latestLoadIdRef.current) return;
      setError(e.message);
      setStatus('error');
    }
  }, [syncVisible]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const { rows: visibleRows, prefetchedRows, hasNext } = board;
  const visibleA = visibleRows.map((row) => row.left).filter(Boolean);
  const visibleB = visibleRows.map((row) => row.right).filter(Boolean);

  const canAdvance = hasNext || prefetchedRows.length > 0;

  const advanceWindow = useCallback(async () => {
    if (isAdvancing) return;

    const loadId = latestLoadIdRef.current + 1;
    setIsAdvancing(true);
    setBoard((prev) => shiftBoardByOne(prev));

    try {
      const result = await advanceCheckPointer();
      if (result?.advanced === false && result?.reason) {
        setError(`Không thể chuyển tiếp: ${result.reason}`);
        await load();
        return;
      }

      setError(null);
      await syncVisible(loadId);
      await appendPrefetch(loadId);
    } catch (e) {
      setError(e.message);
      await load();
    } finally {
      setIsAdvancing(false);
    }
  }, [appendPrefetch, isAdvancing, load, syncVisible]);

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

  return (
    <motion.div
      className="display-board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="display-board__canvas"
        aria-label={pageTitle}
        layout
        transition={{ layout: { duration: 0.35 } }}
      >
        <motion.div
          className="display-board__split"
          layout
          transition={{ layout: { duration: 0.35 } }}
        >
          <LeftColumn items={visibleA} slotCount={ROW_LIMIT} />
          <RightColumn items={visibleB} slotCount={ROW_LIMIT} />
        </motion.div>

        <div className="display-board__meta" role="status" aria-live="polite">
          <span className="display-board__meta-title">{pageTitle}</span>
          {status !== 'ok' && (
            <motion.div
              className="display-board__status"
              layout
              transition={{ layout: { duration: 0.35 } }}
            >
              {status === 'loading' && <span>Đang kết nối API…</span>}
              {status === 'error' && <span className="display-board__status--err">{error}</span>}
            </motion.div>
          )}
          {enableAdvance && (
            <button
              className="display-board__next-btn"
              type="button"
              onClick={advanceWindow}
              aria-keyshortcuts="Enter"
              disabled={!canAdvance || isAdvancing}
            >
              Chuyển tiếp
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
