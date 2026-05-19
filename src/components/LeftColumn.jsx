import { AnimatePresence } from 'framer-motion';
import PersonCard from './PersonCard';

export default function LeftColumn({ items, listRef }) {
  return (
    <section className="board-column board-column--left" aria-label="Nhóm A">
      <header className="board-column__header">
        <span className="board-column__badge board-column__badge--a">A</span>
        <h2>Nhóm A</h2>
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
