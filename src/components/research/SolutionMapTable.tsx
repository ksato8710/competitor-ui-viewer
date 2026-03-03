import type { SolutionCategory } from "@/lib/types";

export default function SolutionMapTable({
  categories,
}: {
  categories: SolutionCategory[];
}) {
  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.category}>
          <h4 className="text-sm font-semibold text-text-bright mb-3">
            {cat.category}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-bg-section">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-text-dim border-b border-border-card w-[140px]">
                    ソリューション
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-text-dim border-b border-border-card">
                    概要
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-text-dim border-b border-border-card w-[200px]">
                    強み
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-text-dim border-b border-border-card w-[200px]">
                    弱み
                  </th>
                </tr>
              </thead>
              <tbody>
                {cat.entries.map((entry) => (
                  <tr key={entry.name} className="hover:bg-bg-hover transition-colors">
                    <td className="px-3 py-2.5 font-medium text-text-bright border-b border-border-card align-top">
                      {entry.name}
                    </td>
                    <td className="px-3 py-2.5 text-text-primary border-b border-border-card align-top">
                      {entry.description}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border-card align-top">
                      <ul className="space-y-1">
                        {entry.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-text-primary">
                            <span className="text-score-high shrink-0 mt-0.5">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2.5 border-b border-border-card align-top">
                      <ul className="space-y-1">
                        {entry.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-text-primary">
                            <span className="text-score-low shrink-0 mt-0.5">-</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
