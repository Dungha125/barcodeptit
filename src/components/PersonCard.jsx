import { motion } from 'framer-motion';

function getInitials(hoTen) {
  if (!hoTen) return '?';
  const parts = hoTen.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function accentFromId(id) {
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 2 === 0 ? 'card--red' : 'card--orange';
}

export default function PersonCard({ person, index = 0 }) {
  const hoTen = person.ho_ten || `${person.ho_dem || ''} ${person.ten || ''}`.trim();
  const meta = [person.nganh, person.lop, person.xep_loai].filter(Boolean);
  const hasMeta = meta.length > 0;
  const borderClass = accentFromId(person.id || person.ma_sv || index);

  return (
    <motion.article
      className={`person-card ${borderClass} ${hasMeta ? 'person-card--with-meta' : 'person-card--compact'}`}
      layout
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 28,
        opacity: { duration: 0.35 },
      }}
    >
      <div className="person-card__avatar" aria-hidden>
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" />
        ) : (
          <span className="person-card__initials">{getInitials(hoTen)}</span>
        )}
      </div>
      <div className="person-card__name">
        <h3 title={hoTen || '—'}>{hoTen || '—'}</h3>
        {person.ma_sv && <span className="person-card__masv" title={person.ma_sv}>{person.ma_sv}</span>}
      </div>
      {hasMeta && (
        <div className="person-card__meta">
          {meta.map((line, i) => (
            <p key={i} className="person-card__meta-line" title={line}>
              {line}
            </p>
          ))}
        </div>
      )}
    </motion.article>
  );
}
