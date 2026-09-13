import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/zollhaus/admin/actions';
import { hasZollhausAccess } from '@/lib/cms/auth';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';

export const metadata: Metadata = {
  title: 'Zollhaus Admin Login',
  description: 'Geschützter Zugang für den künftigen Zollhaus-Adminbereich.',
};

export default async function ZollhausAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; locked?: string }>;
}) {
  const params = await searchParams;

  if (await hasZollhausAccess()) {
    redirect('/zollhaus/admin');
  }

  return (
    <div className={styles.grid}>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Zollhaus-Login</h2>
        <div className={styles.panelBody}>
          <p>
            Dieser Zugang ist ausschließlich für berechtigte Administratoren des Zollhaus-Bereichs vorgesehen.
          </p>
          <p>
            Die Prüfung erfolgt vollständig serverseitig. Fehlgeschlagene Anmeldungen werden begrenzt und kurzzeitig
            gesperrt.
          </p>
        </div>
        {params.error ? <div className={styles.mutedCard}>Anmeldung fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.</div> : null}
        {params.locked ? <div className={styles.mutedCard}>Zu viele Fehlversuche. Bitte versuchen Sie es in einigen Minuten erneut.</div> : null}
      </section>

      <aside className={styles.panel}>
        <p className={styles.placeholderNote}>Geschützter Bereich</p>
        <div className={styles.panelBody}>
          <p>Headbang-Administratoren dürfen diesen Bereich ebenfalls nutzen. Ein Zollhaus-Admin erhält jedoch keine globalen Rechte.</p>
        </div>
      </aside>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Anmeldung</h2>
        <form action={loginAction} className={styles.form}>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="zollhaus-username">Benutzername</label>
              <input id="zollhaus-username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="zollhaus-password">Passwort</label>
              <input id="zollhaus-password" name="password" type="password" autoComplete="current-password" required />
            </div>
          </div>
          <button type="submit" className={styles.disabledButton} style={{ cursor: 'pointer', color: 'var(--zollhaus-text)' }}>
            Anmelden
          </button>
        </form>
      </section>

      <aside className={styles.panel}>
        <h2 className={styles.panelTitle}>Aktueller Stand</h2>
        <div className={styles.panelBody}>
          <p>
            Produkt- und Bestellverwaltung folgen später. In diesem Schritt wird nur der getrennte Zugriffsschutz für
            Zollhaus und Headbang aktiviert.
          </p>
        </div>
      </aside>
    </div>
  );
}