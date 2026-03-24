export function SectionPartners() {
  const partners = [
    'Mustermann GmbH',
    'Handwerk AG',
    'MetallBau Schmidt',
    'Elektro König',
    'Tischlerei Braun',
    'SHK-Meister',
  ];

  return (
    <section className="py-18 bg-transparent border-y border-[#2a2a2a]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-[0.24em]">
          Unsere Partner & Sponsoren
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {partners.map((partner) => (
            <div
              key={partner}
              className="px-6 py-3 rounded-full bg-[linear-gradient(180deg,rgba(31,20,14,0.72)_0%,rgba(15,10,8,0.22)_100%)] ring-1 ring-white/6 text-gray-400 text-sm font-medium hover:ring-orange-500/30 hover:text-gray-200 transition-all"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
