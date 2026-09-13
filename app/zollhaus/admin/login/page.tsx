import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/zollhaus/admin/actions';
import { hasZollhausAccess } from '@/lib/cms/auth';
import { zollhausShellStyles as styles } from '@/components/zollhaus/zollhaus-shell';

export const metadata: Metadata = {
  title: 'Zollhaus Admin Login',
  description: 'Geschützter Zugang für den Zollhaus-Shop.',
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
          <p>Dieser Zugang ist für berechtigte Administratorinnen und Administratoren des Zollhaus-Shops vorgesehen.</p>
          <p>Bitte melden Sie sich mit Ihren persönlichen Zugangsdaten an.</p>
        </div>
        {params.error ? <div className={styles.mutedCard}>Anmeldung fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.</div> : null}
        {params.locked ? <div className={styles.mutedCard}>Zu viele Fehlversuche. Bitte versuchen Sie es in einigen Minuten erneut.</div> : null}
      </section>

      <aside className={styles.panel}>
        <p className={styles.placeholderNote}>Geschützter Bereich</p>
        <div className={styles.panelBody}>
          <p>Der Login öffnet den geschützten Verwaltungsbereich für Produkte, Bestellungen und Shopvorschau.</p>
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
        <h2 className={styles.panelTitle}>Hinweis</h2>
        <div className={styles.panelBody}>
          <p>Bei Fragen zur Verwaltung hilft die geschützte Zollhaus-Administration mit Produktübersicht, Bestellungen und Vorschau.</p>
        </div>
      </aside>
    </div>
  );
}