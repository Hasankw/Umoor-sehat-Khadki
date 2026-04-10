import { AsharaPreparation, PreparationCategory } from "@/types";
import { Hotel, Car, ParkingSquare, ShoppingBag } from "lucide-react";

interface Props {
  preparations: AsharaPreparation[];
}

const CATEGORY_META: Record<PreparationCategory, { label: string; icon: React.ReactNode; color: string }> = {
  accommodation: {
    label: "Accommodation",
    icon: <Hotel className="w-5 h-5" />,
    color: "bg-blue-50 border-blue-200",
  },
  transport: {
    label: "Transport",
    icon: <Car className="w-5 h-5" />,
    color: "bg-green-50 border-green-200",
  },
  parking: {
    label: "Parking",
    icon: <ParkingSquare className="w-5 h-5" />,
    color: "bg-purple-50 border-purple-200",
  },
  essentials: {
    label: "Essentials",
    icon: <ShoppingBag className="w-5 h-5" />,
    color: "bg-amber-50 border-amber-200",
  },
};

export default function PreparationSection({ preparations }: Props) {
  const grouped = preparations.reduce((acc, prep) => {
    if (!acc[prep.category]) acc[prep.category] = [];
    acc[prep.category].push(prep);
    return acc;
  }, {} as Record<PreparationCategory, AsharaPreparation[]>);

  const categories: PreparationCategory[] = ["accommodation", "transport", "parking", "essentials"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat];
        const items = grouped[cat] || [];
        return (
          <div key={cat} className={`rounded-xl border p-5 ${meta.color}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white shadow-sm" style={{ color: "var(--color-navy)" }}>
                {meta.icon}
              </div>
              <h3 className="font-heading font-bold text-base" style={{ color: "var(--color-navy)" }}>
                {meta.label}
              </h3>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">Details coming soon.</p>
            ) : (
              <div className="space-y-3">
                {items.sort((a, b) => a.display_order - b.display_order).map((item) => (
                  <div key={item.id}>
                    <p className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>{item.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
