import { Metadata } from "next";
import { MapPin, Clock, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "About Khadki Jamaat",
  description: "History of Dawoodi Bohra Jamaat in Khadki, Pune. Syedna visits and community heritage.",
};

const SYEDNA_VISITS = [
  {
    year: "1940s",
    dai: "Syedna Taher Saifuddin RA (52nd Dai)",
    occasion: "Official visit to Khadki Jamaat",
    notes: "First recorded visit of the Dai al-Mutlaq to Khadki. The community received great blessings.",
  },
  {
    year: "1960s",
    dai: "Syedna Taher Saifuddin RA (52nd Dai)",
    occasion: "Ashara Mubaraka, Khadki",
    notes: "Ashara Mubaraka held in Khadki — a landmark event for the jamaat.",
  },
  {
    year: "2000s",
    dai: "Syedna Mohammed Burhanuddin RA (52nd Dai)",
    occasion: "Visit to Khadki",
    notes: "His Holiness graced the jamaat with his presence and blessed the mumeeneen.",
  },
  {
    year: "Expected 2026",
    dai: "Syedna Mufaddal Saifuddin TUS (53rd Dai)",
    occasion: "Ashara Mubaraka 1448H",
    notes: "Ashara 1448H expected in Khadki — an unprecedented honour for the community.",
    highlight: true,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="py-16 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-navy) 0%, #243660 100%)" }}>
        <div className="max-w-4xl mx-auto relative">
          <div className="h-1 w-12 rounded mb-4" style={{ background: "var(--color-gold)" }} />
          <h1 className="font-heading font-bold text-4xl text-white mb-3">About Khadki Jamaat</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            History, heritage, and the blessed presence of the Dai al-Mutlaq in Khadki, Pune
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* About Khadki */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl border bg-white p-6"
            style={{ borderColor: "rgba(207,155,0,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
              <h2 className="section-heading text-xl">Khadki, Pune</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                Khadki (formerly Kirkee) is a historic cantonment town in Pune, Maharashtra.
                Established during British rule, it lies north of Pune city and is home to
                significant military and civilian heritage.
              </p>
              <p>
                The Dawoodi Bohra community has been present in Khadki for generations,
                maintaining a vibrant jamaat with a masjid, sanitarium, madrasa, and community halls —
                Fakri Hall and Shujai Hall.
              </p>
              <p>
                The Khadki Bohra Sanitarium has long served as a place of rest and recuperation
                for mumeeneen visiting Pune and for those travelling for Ashara Mubaraka.
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(207,155,0,0.2)", minHeight: "280px" }}>
            <iframe
              src="https://maps.google.com/maps?q=Khadki+Pune+Maharashtra&output=embed&z=14"
              className="w-full h-full min-h-[280px]"
              loading="lazy"
              title="Khadki Pune Satellite Map"
            />
          </div>
        </div>

        {/* Community */}
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: "rgba(207,155,0,0.2)" }}>
          <h2 className="section-heading text-xl mb-4">Dawoodi Bohra Community</h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
            <p>
              The Dawoodi Bohras are a community of Shia Ismaili Tayyebi Muslims, led by the
              Al-Dai Al-Mutlaq — the absolute representative of the Imam in seclusion.
              The 53rd Al-Dai Al-Mutlaq, His Holiness <strong>Syedna Mufaddal Saifuddin TUS</strong>,
              guides approximately one million mumeeneen across the world.
            </p>
            <p>
              The community traces its heritage to the Fatimi Imams — descendants of the Prophet
              Muhammad SAW through Imam Ali AS and Fatima AS. The Fatimi dynasty flourished in
              North Africa and the Middle East from the 10th to 12th centuries.
            </p>
            <p>
              The primary concentration of Dawoodi Bohras is in India, with Khadki being one of
              the jamaat communities in Maharashtra under the direct spiritual guidance of the Dai al-Mutlaq.
            </p>
          </div>
        </div>

        {/* Syedna Visits Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
            <h2 className="section-heading text-xl">Syedna Visits to Khadki</h2>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5"
              style={{ background: "rgba(207,155,0,0.3)" }} />
            <div className="space-y-6">
              {SYEDNA_VISITS.map((visit, i) => (
                <div key={i} className="flex gap-5 relative">
                  {/* Dot */}
                  <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-xs font-bold z-10 border-2 ${
                    visit.highlight ? "text-white" : "bg-white"
                  }`}
                    style={visit.highlight
                      ? { background: "var(--color-gold)", borderColor: "var(--color-gold)" }
                      : { borderColor: "var(--color-gold)", color: "var(--color-gold-dark)" }}>
                    {visit.highlight ? "★" : (i + 1)}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 rounded-xl border p-5 ${visit.highlight ? "ring-1" : ""}`}
                    style={visit.highlight
                      ? { background: "rgba(207,155,0,0.06)", borderColor: "var(--color-gold)", outline: "2px solid rgba(207,155,0,0.4)" }
                      : { background: "white", borderColor: "rgba(207,155,0,0.15)" }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-heading font-bold text-base" style={{ color: "var(--color-navy)" }}>
                          {visit.occasion}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{visit.dai}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                        style={{ background: "rgba(207,155,0,0.1)", color: "var(--color-gold-dark)" }}>
                        <Clock className="w-3 h-3" />{visit.year}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{visit.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bismillah footer */}
        <div className="text-center py-6">
          <p className="bismillah text-2xl">اللهم صل على محمد وآل محمد</p>
          <p className="text-gray-400 text-sm mt-2">
            May Allah bless Khadki Jamaat and all mumeeneen under the blessed guidance of
            Mawlana Syedna Mufaddal Saifuddin TUS.
          </p>
        </div>
      </div>
    </div>
  );
}
