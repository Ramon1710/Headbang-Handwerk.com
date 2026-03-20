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
    <section className="py-16 bg-[#0a0a0a] border-y border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600 text-sm mb-8 uppercase tracking-wider">
          Unsere Partner & Sponsoren
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {partners.map((partner) => (
            <div
              key={partner}
              className="px-6 py-3 rounded-lg border border-[#2a2a2a] bg-[#141414] text-gray-600 text-sm font-medium hover:border-orange-500/30 hover:text-gray-400 transition-all"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
