import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchDisplay } from '../api';
import LeftColumn from './LeftColumn';
import RightColumn from './RightColumn';

const POLL_MS = 3000;
const REVEAL_MS = 2500;

function itemKey(item) {
  return `${item.group}-${item.ma_sv || item.id}`;
}

function useRevealQueue(groupItems) {
  const [visible, setVisible] = useState([]);
  const seen = useRef(new Set());
  const queue = useRef([]);

  useEffect(() => {
    for (const item of groupItems) {
      const key = itemKey(item);
      if (!seen.current.has(key)) {
        seen.current.add(key);
        queue.current.push(item);
      }
    }
  }, [groupItems]);

  useEffect(() => {
    const id = setInterval(() => {
      if (queue.current.length === 0) return;
      const next = queue.current.shift();
      setVisible((prev) => [...prev, next]);
    }, REVEAL_MS);
    return () => clearInterval(id);
  }, []);

  return visible;
}

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

export default function DisplayBoard() {
  const [groupA, setGroupA] = useState([]);
  const [groupB, setGroupB] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchDisplay();
      setGroupA(data.groupA || []);
      setGroupB(data.groupB || []);
      setStatus('ok');
      setError(null);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const visibleA = useRevealQueue(groupA);
  const visibleB = useRevealQueue(groupB);

  useAutoScroll(leftScrollRef, visibleA.length);
  useAutoScroll(rightScrollRef, visibleB.length);

  return (
    <motion.div
      className="display-board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="display-board__top">
        <h1 className="display-board__title">BẢNG TRÌNH CHIẾU</h1>
        <div className="display-board__status">
          {status === 'loading' && <span>Đang kết nối API…</span>}
          {status === 'error' && <span className="display-board__status--err">{error}</span>}
          {status === 'ok' && (
            <span>
              A: {visibleA.length}/{groupA.length} · B: {visibleB.length}/{groupB.length}
            </span>
          )}
        </div>
      </header>

      <div className="display-board__split">
        <LeftColumn items={visibleA} listRef={leftScrollRef} />
        <div className="display-board__divider" aria-hidden />
        <RightColumn items={visibleB} listRef={rightScrollRef} />
      </div>
    </motion.div>
  );
}
