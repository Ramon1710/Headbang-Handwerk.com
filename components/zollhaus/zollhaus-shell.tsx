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
            <a
              href="https://zollhaus-leer.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.brandLink}
              aria-label="Zur offiziellen Zollhaus-Website in einem neuen Tab"
            >
              <Image
                src="/zollhaus/branding/zollhaus-logo.webp"
                alt="Zollhaus – Raum für Kultur"
                width={2048}
                height={1825}
                sizes="(max-width: 480px) 110px, (max-width: 1024px) 140px, 160px"
                className={styles.brandLogo}
                priority
              />
            </a>

            <a href="https://zollhaus-leer.com/" target="_blank" rel="noopener noreferrer" className={styles.backLink}>
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