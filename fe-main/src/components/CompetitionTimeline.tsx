import { Calendar } from "lucide-react";
import type { TimelineEntry } from "@/lib/competitions";

interface CompetitionTimelineProps {
  timeline: TimelineEntry[] | Record<string, never> | null;
  isLoading?: boolean;
}

export default function CompetitionTimeline({ timeline, isLoading }: CompetitionTimelineProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ml-4">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-5 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle empty object or null/empty array
  const isValidTimeline = timeline && Array.isArray(timeline) && timeline.length > 0;
  
  if (!isValidTimeline) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No timeline information available</p>
      </div>
    );
  }

  // TypeScript knows timeline is an array here
  const timelineArray = timeline as TimelineEntry[];

  return (
    <ol className="relative border-l border-border ml-2 space-y-4">
      {timelineArray.map((entry, index) => (
        <li key={index} className="mb-2 ml-4">
          <div className="absolute w-3 h-3 bg-primary rounded-full -left-1.5 border-2 border-background mt-1.5"></div>
          <time className="text-xs text-muted-foreground font-medium">{entry.date}</time>
          <h5 className="text-sm font-semibold mt-1">{entry.description}</h5>
        </li>
      ))}
    </ol>
  );
}
