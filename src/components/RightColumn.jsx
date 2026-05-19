import { AnimatePresence } from 'framer-motion';
import PersonCard from './PersonCard';

export default function RightColumn({ items, listRef }) {
  return (
    <section className="board-column board-column--right" aria-label="Nhóm B">
      <header className="board-column__header">
        <span className="board-column__badge board-column__badge--b">B</span>
        <h2>Nhóm B</h2>
      </header>
      <div className="board-column__scroll" ref={listRef}>
        <AnimatePresence mode="popLayout">
          {items.map((person, index) => (
            <PersonCard key={person.id || person.ma_sv} person={person} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
