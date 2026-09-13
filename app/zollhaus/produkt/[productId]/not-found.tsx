import Link from 'next/link';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';
import shopStyles from '@/components/zollhaus/public-shop.module.css';

export default function ZollhausProductNotFound() {
  return (
    <div className={shopStyles.stack}>
      <section className={styles.panel}>
        <p className={shopStyles.eyebrow}>Nicht gefunden</p>
        <h2 className={styles.panelTitle}>Dieses Produkt ist nicht öffentlich verfügbar.</h2>
        <div className={styles.panelBody}>
          <p>Die angeforderte Produktseite existiert nicht, ist archiviert oder aktuell nicht veröffentlicht.</p>
        </div>
        <Link href="/zollhaus" className={shopStyles.detailBackLink}>
          <span aria-hidden="true">←</span>
          Zurück zum Zollhaus-Shop
        </Link>
      </section>
    </div>
  );
}
