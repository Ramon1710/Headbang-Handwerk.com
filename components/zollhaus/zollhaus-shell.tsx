import type { ReactNode } from 'react';
import Image from 'next/image';
import headbangLogo from '../../Headbang Handwerk e.V. Logo Final PNG.png';
import styles from './zollhaus-shell.module.css';

interface ZollhausShellProps {
  children: ReactNode;
}

export function ZollhausShell({ children }: ZollhausShellProps) {
  return (
    <div className={styles.shell} data-zollhaus-root>
      <div className={styles.frame}>
        <header className={styles.topBar}>
          <a href="https://zollhaus-leer.com/" target="_blank" rel="noreferrer noopener" className={styles.backLink}>
            <span aria-hidden="true">↗</span>
            <span>
              <span className={styles.backLabel}>Zurück zum Zollhaus</span>
              <span className={styles.backMeta}>Externer Link</span>
            </span>
          </a>

          <div className={styles.supportBadge}>
            <div>
              <p className={styles.supportText}>Technisch unterstützt von Headbang Handwerk e.V.</p>
            </div>
            <Image
              src={headbangLogo}
              alt="Headbang Handwerk e.V."
              className={styles.supportLogo}
              priority={false}
            />
          </div>
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>Microsite Vorschau</p>
          <h1 className={styles.brand}>
            Zollhaus Shop
            <span className={styles.brandSubline}>Zollhaus Leer</span>
          </h1>
          <p className={styles.intro}>
            Dieser Bereich wird als eigenständige Microsite innerhalb der bestehenden Anwendung vorbereitet. Navigation,
            Footer und redaktionelle Headbang-Bausteine bleiben hier bewusst außen vor.
          </p>
        </section>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export { styles as zollhausShellStyles };