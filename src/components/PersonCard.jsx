import { useState } from 'react';
import { motion } from 'framer-motion';
import { NO_PHOTO_AVATAR } from '../api';

function getInitials(hoTen) {
  if (!hoTen) return '?';
  const parts = hoTen.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function accentFromId(id) {
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 2 === 0 ? 'person-card--red' : 'person-card--orange';
}

function isHttpAvatar(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export default function PersonCard({ person, index = 0, onNoPhoto }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hoTen = person.ho_ten || `${person.ho_dem || ''} ${person.ten || ''}`.trim();
  const borderClass = accentFromId(person.id || person.ma_sv || index);
  const avatarIsHttp = isHttpAvatar(person.avatar_url);
  const isNoPhoto = person.avatar_url === NO_PHOTO_AVATAR;
  const canSetNoPhoto = Boolean(
    onNoPhoto && person.ma_sv && person.sheet_row && person.group
  );

  const handleNoPhoto = async () => {
    if (!canSetNoPhoto || isSubmitting || isNoPhoto) return;
    try {
      setIsSubmitting(true);
      await onNoPhoto(person);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.article
      className={`person-card ${borderClass} person-card--with-actions`}
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
      <motion.div className="person-card__avatar" aria-hidden layout>
        {avatarIsHttp ? (
          <img src={person.avatar_url} alt="" />
        ) : (
          <span className="person-card__initials">{getInitials(hoTen)}</span>
        )}
      </motion.div>
      <motion.div className="person-card__name" layout>
        <h3 title={hoTen || '—'}>{hoTen || '—'}</h3>
        {person.ma_sv && <span className="person-card__masv" title={person.ma_sv}>{person.ma_sv}</span>}
      </motion.div>
      {canSetNoPhoto && (
        <motion.div className="person-card__actions" layout>
          <button
            type="button"
            className="person-card__no-photo-btn"
            onClick={handleNoPhoto}
            disabled={isSubmitting || isNoPhoto}
            title={isNoPhoto ? 'Đã đánh dấu không có ảnh' : 'Ghi G:RECORD\\ptit.png lên Sheet'}
          >
            {isSubmitting ? 'Đang ghi…' : isNoPhoto ? 'Đã đánh dấu' : 'Không có'}
          </button>
        </motion.div>
      )}
    </motion.article>
  );
}
