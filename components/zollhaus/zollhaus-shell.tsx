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
      <div className={styles.topStripe} aria-hidden="true" />
      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.brandArea}>
            <a href="https://zollhaus-leer.com/" target="_blank" rel="noreferrer noopener" className={styles.brandLink}>
              <Image
                src="/zollhaus/zollhaus-logo.svg"
                alt="Zollhaus – Raum für Kultur"
                width={420}
                height={160}
                className={styles.brandLogo}
                priority
              />
            </a>

            <a href="https://zollhaus-leer.com/" target="_blank" rel="noreferrer noopener" className={styles.backLink}>
              Zurück zur Zollhaus-Website
            </a>
          </div>

          <div className={styles.supportBadge}>
            <div>
              <p className={styles.supportText}>Technisch unterstützt von Headbang Handwerk e.V.</p>
            </div>
            <Image src={headbangLogo} alt="Headbang Handwerk e.V." className={styles.supportLogo} priority={false} />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export { styles as zollhausShellStyles };