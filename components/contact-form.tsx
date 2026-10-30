'use client';

import { useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { contactFieldLimits, contactInterestOptions } from '@/lib/contact';
import { Button } from './ui/button';

export function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    subject: '',
    message: '',
    interests: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result: unknown = await res.json();
      if (!res.ok) {
        setError(
          result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Leider konnte die Nachricht nicht versendet werden. Bitte schreibe direkt an info@headbang-handwerk.de.'
        );
        return;
      }
      if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true
        || !('status' in result) || result.status !== 'accepted') {
        throw new Error('Mail acceptance was not confirmed');
      }
      setSuccess(true);
    } catch {
      setError('Der Versand konnte nicht bestätigt werden. Bitte prüfe deine Verbindung oder schreibe direkt an info@headbang-handwerk.de.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div role="status" className="rounded-xl border border-green-700/50 bg-green-950/20 p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="section-title mb-2 text-[1.7rem]">Nachricht zum Versand angenommen!</h3>
        <p className="body-copy text-sm">
          Unser Maildienst hat deine Nachricht angenommen. Das bestätigt noch nicht die Zustellung im Postfach.
          Wir melden uns in der Regel innerhalb von 1–2 Werktagen bei dir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="body-copy mb-1.5 block text-sm">Name *</label>
          <input
            required
            type="text"
            maxLength={contactFieldLimits.name}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
            placeholder="Max Mustermann"
          />
        </div>
        <div>
          <label className="body-copy mb-1.5 block text-sm">Unternehmen</label>
          <input
            type="text"
            maxLength={contactFieldLimits.company}
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
            placeholder="Mustermann GmbH"
          />
        </div>
      </div>

      <div>
        <label className="body-copy mb-1.5 block text-sm">E-Mail *</label>
        <input
          required
          type="email"
          maxLength={contactFieldLimits.email}
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
          placeholder="max@mustermann.de"
        />
      </div>

      <div>
        <label className="body-copy mb-1.5 block text-sm">Betreff *</label>
        <input
          required
          type="text"
          maxLength={contactFieldLimits.subject}
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          className="body-copy w-full rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
          placeholder="Dein Betreff..."
        />
      </div>

      <div>
        <label className="body-copy mb-2 block text-sm">Ich interessiere mich für</label>
        <div className="flex flex-wrap gap-2">
          {contactInterestOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleInterest(option)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                form.interests.includes(option)
                  ? 'border-[color:var(--color-accent)] bg-[color:var(--color-surface)] text-[color:var(--text-link)]'
                  : 'border-[color:var(--color-border)] text-[color:var(--text-copy)] hover:border-[color:var(--color-accent)]/40',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="body-copy mb-1.5 block text-sm">Nachricht *</label>
        <textarea
          required
          rows={5}
          maxLength={contactFieldLimits.message}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="body-copy w-full resize-none rounded-lg border border-[color:var(--color-border)] bg-black/30 px-4 py-2.5 text-sm transition-colors placeholder:text-[#9b8570] focus:border-[color:var(--color-accent)] focus:outline-none"
          placeholder="Deine Nachricht..."
        />
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-sm bg-red-950/20 border border-red-700/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Senden...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Nachricht senden
          </>
        )}
      </Button>
    </form>
  );
}
