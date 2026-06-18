import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import styles from './LanguageToggle.module.css';

export function LanguageToggle() {
  const { lang, toggleLang } = useI18n();
  const label = lang === 'en' ? 'ES' : 'EN';
  const title = lang === 'en' ? 'Cambiar a Español' : 'Switch to English';

  return (
    <button className={styles.toggle} onClick={toggleLang} title={title} aria-label={title}>
      <Globe size={12} className={styles.icon} />
      <span className={styles.current}>{lang.toUpperCase()}</span>
      <span className={styles.separator}>/</span>
      <span className={styles.other}>{label}</span>
    </button>
  );
}
