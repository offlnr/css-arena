import { useState, type KeyboardEvent, type FC } from 'react';
import { Users } from 'lucide-react';
import styles from './IndexPage.module.css';

interface IndexPageProps {
  onCreateRoom: (username: string) => void;
  onJoinRoom:   (username: string) => void;
}

export const IndexPage: FC<IndexPageProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');

  const validate = (): boolean => {
    if (!username.trim()) {
      setError('El nombre de usuario es requerido');
      return false;
    }
    setError('');
    return true;
  };

  const handleCreate = () => { if (validate()) onCreateRoom(username.trim()); };
  const handleJoin   = () => { if (validate()) onJoinRoom(username.trim()); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Terminal badge */}
        <div className={styles.logoBadge}>
          <span className={styles.logoBadgeText}>&gt;_</span>
        </div>

        {/* Title */}
        <div className={styles.headerText}>
          <h1 className={styles.title}>CSS Arena</h1>
          <p className={styles.subtitle}>Replica el diseño. Gana la partida.</p>
        </div>

        {/* Form card */}
        <div className={styles.card}>
          <div className={styles.form}>
            {/* Username field */}
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>NOMBRE DE USUARIO</label>
              <input
                type="text"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder="Ej: dev_master_42"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                onKeyDown={onKeyDown}
                maxLength={24}
                autoFocus
              />
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            {/* Buttons */}
            <div className={styles.buttons}>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                + Crear nueva sala
              </button>
              <button className={styles.btnSecondary} onClick={handleJoin}>
                <Users size={15} />
                Unirse a sala
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          v0.1.0 — Construido con <span className={styles.footerHeart}>♥</span> y CSS
        </p>
      </div>
    </div>
  );
};
