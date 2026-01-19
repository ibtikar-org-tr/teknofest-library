import { Trophy } from "lucide-react";
import type { AwardEntry } from "@/lib/competitions";

interface CompetitionAwardsProps {
  awards: Record<string, AwardEntry[]> | AwardEntry[] | null;
  isLoading?: boolean;
}

export default function CompetitionAwards({ awards, isLoading }: CompetitionAwardsProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-muted rounded-xl"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-20 bg-muted rounded-xl"></div>
          <div className="h-20 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!awards) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No award information available</p>
      </div>
    );
  }

  // Check if awards is a simple array (single category) or object (multiple categories)
  const isMultiCategory = !Array.isArray(awards);

  if (isMultiCategory) {
    // Multiple categories
    return (
      <div className="space-y-8">
        {Object.entries(awards).map(([categoryName, categoryAwards]) => (
          <div key={categoryName}>
            <h3 className="text-lg font-bold mb-4 text-primary">{categoryName}</h3>
            <AwardsList awards={categoryAwards} />
          </div>
        ))}
      </div>
    );
  }

  // Single category
  return <AwardsList awards={awards as AwardEntry[]} />;
}

function AwardsList({ awards }: { awards: AwardEntry[] }) {
  // Get the first place award for special display
  const firstPlace = awards.find(
    (a) => a.degree && (a.degree.toLowerCase().includes("birinci") || a.degree.toLowerCase().includes("first"))
  );
  const otherAwards = awards.filter((a) => a !== firstPlace);

  return (
    <div className="grid gap-6">
      {firstPlace && (
        <div className="p-6 border-2 border-primary/30 bg-primary/5 rounded-xl flex items-center gap-6">
          <div className="p-3 bg-primary/20 rounded-full">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
              {firstPlace.degree}
            </div>
            <div className="text-3xl font-bold font-display">{firstPlace.award}</div>
          </div>
        </div>
      )}

      {otherAwards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {otherAwards.map((award, index) => (
            <div key={index} className="p-4 border border-border bg-card rounded-xl">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {award.degree}
              </div>
              <div className="text-2xl font-bold font-display">{award.award}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
