'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const interestOptions = [
  'Sponsoring Bronze',
  'Sponsoring Silber',
  'Sponsoring Gold',
  'Exklusivpartner',
  'Bannerfläche',
  'Merchandise',
  'Allgemeine Anfrage',
];

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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Fehler beim Senden');
      setSuccess(true);
    } catch {
      setError('Leider ist ein Fehler aufgetreten. Bitte versuche es erneut oder schreibe uns direkt eine E-Mail.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-700/50 bg-green-950/20 p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-white font-bold text-xl mb-2">Nachricht gesendet!</h3>
        <p className="text-gray-400 text-sm">
          Danke für deine Anfrage. Wir melden uns innerhalb von 1–2 Werktagen bei dir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Max Mustermann"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Unternehmen</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Mustermann GmbH"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">E-Mail *</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="max@mustermann.de"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Betreff *</label>
        <input
          required
          type="text"
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="Dein Betreff..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Ich interessiere mich für</label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleInterest(option)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                form.interests.includes(option)
                  ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                  : 'border-[#2a2a2a] text-gray-500 hover:border-orange-500/40 hover:text-gray-300',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Nachricht *</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          placeholder="Deine Nachricht..."
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/20 border border-red-700/30 rounded-lg px-4 py-3">
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
