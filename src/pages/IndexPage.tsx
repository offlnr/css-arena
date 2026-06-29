import { useState, type KeyboardEvent, type FC } from 'react';
import { Users } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import styles from './IndexPage.module.css';

interface IndexPageProps {
  onCreateRoom: (username: string) => void;
  onJoinRoom:   (username: string) => void;
}

export const IndexPage: FC<IndexPageProps> = ({ onCreateRoom, onJoinRoom }) => {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');

  const validate = (): boolean => {
    if (!username.trim()) {
      setError(t('index_username_required'));
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

  const [footerBefore, footerAfter] = t('index_footer').split('♥');

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.logoBadge}>
          <span className={styles.logoBadgeText}>&gt;_</span>
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.title}>CSS Arena</h1>
          <p className={styles.subtitle}>{t('index_subtitle')}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.form}>
            <div className={styles.fieldWrapper}>
              <label className={styles.label}>{t('index_username_label')}</label>
              <input
                type="text"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                placeholder={t('index_username_placeholder')}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                onKeyDown={onKeyDown}
                maxLength={24}
                autoFocus
              />
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            <div className={styles.buttons}>
              <button className={styles.btnPrimary} onClick={handleCreate}>
                {t('index_create_room')}
              </button>
              <button className={styles.btnSecondary} onClick={handleJoin}>
                <Users size={15} />
                {t('index_join_room')}
              </button>
            </div>
          </div>
        </div>

        <p className={styles.footer}>
          {`v0.1.0 — ${footerBefore}`}
          <span className={styles.footerHeart}>♥</span>
          {footerAfter}
        </p>
      </div>
    </div>
  );
};
