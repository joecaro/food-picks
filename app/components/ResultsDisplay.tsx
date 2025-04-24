"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card components
import { cn } from "@/lib/utils";

// Define the expected shape of an item in the aggregateScores array
// Based on TODO/Design doc - adjust if API returns different structure
interface ResultItem {
  restaurant_id: string; // Assuming string ID based on previous findings
  name: string;
  cuisine: string;
  average_score: number;
  vote_count: number;
}

interface ResultsDisplayProps {
  results: ResultItem[];
}

// Helper to format the average score
function formatScore(score: number): string {
  return score.toFixed(2); // Format to two decimal places
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  if (!results || results.length === 0) {
    return <p className="text-muted-foreground">No results available yet.</p>;
  }

  // Results should already be sorted by average_score by the API, but sorting here just in case
  const sortedResults = [...results].sort(
    (a, b) => b.average_score - a.average_score
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Voting Results</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {sortedResults.map((result, index) => (
            <li
              key={result.restaurant_id}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg bg-background shadow-sm",
                index === 0 && "bg-green-50 border-green-400 shadow-green-200/50 shadow-md"
              )}
            >
              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-primary w-6 text-center">
                  {index + 1}.
                </span>
                <div>
                  <h3 className="text-lg font-medium">{result.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.cuisine}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-primary">
                  {formatScore(result.average_score)} Avg
                </p>
                <p className="text-xs text-muted-foreground">
                  ({result.vote_count}{" "}
                  {result.vote_count === 1 ? "vote" : "votes"})
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
