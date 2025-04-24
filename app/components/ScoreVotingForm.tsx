"use client";

import { useState, useEffect, useMemo } from "react";
// Import from renamed hook file path
import { useSubmitScores } from "@/lib/hooks/useFoodFights";
import { Button } from "@/components/ui/button";
import { AverageScoreDisplay } from "./AverageScoreDisplay";

// Define the structure of the Restaurant data actually passed as props
interface PartialRestaurant {
  id: string;
  name: string;
  cuisine: string;
}

// Define UserScore type inline - align with DB schema (string id)
type UserScore = { restaurant_id: string; score: number };

interface ScoreVotingFormProps {
  foodFightId: string;
  restaurants: PartialRestaurant[]; // Expect the partial type
  userScores?: UserScore[]; // Scores previously submitted by the user
  endTime: string | Date;
}

// Define emojis for scores 1 to 5
const scoreEmojis = {
  1: "🤢", // Nauseated Face
  2: "🤔", // Thinking Face
  3: "😐", // Neutral Face
  4: "😋", // Face Savouring Food
  5: "🤩", // Star-Struck
};

// Use string keys for restaurant IDs
type ScoresState = { [key: string]: number };

export function ScoreVotingForm({
  foodFightId,
  restaurants,
  userScores,
  endTime,
}: ScoreVotingFormProps) {
  const [scores, setScores] = useState<ScoresState>({});
  const [submittingScore, setSubmittingScore] = useState<string | null>(null); // Format: "restaurantId-score"
  const { mutate: submitScore, isPending } = useSubmitScores(String(foodFightId)); // Renamed mutate for clarity

  // Pre-populate scores from userScores on initial load
  useEffect(() => {
    if (userScores) {
      const initialScores = userScores.reduce((acc, score) => {
        // Ensure restaurant_id is treated as string key
        acc[String(score.restaurant_id)] = score.score;
        return acc;
      }, {} as ScoresState);
      setScores(initialScores);
    }
  }, [userScores]);

  const handleScoreChange = (restaurantId: string, score: number) => {
    const currentScore = scores[restaurantId];
    if (currentScore === score) return; // Don't submit if score hasn't changed

    setScores((prevScores) => ({
      ...prevScores,
      [restaurantId]: score,
    }));

    const scoreKey = `${restaurantId}-${score}`;
    setSubmittingScore(scoreKey);

    // Submit only the single score change
    // NOTE: The hook needs modification to accept this payload and perform optimistic update
    submitScore(
      { restaurant_id: restaurantId, score: score },
      {
        onSettled: () => {
          setSubmittingScore(null);
        },
        onError: (err) => {
          console.error("Error submitting score:", err);
          // Revert optimistic update (hook should handle this)
          // Optionally show specific error message to user
          setScores((prevScores) => ({
            ...prevScores,
            // Revert to previous score if known, or remove if it was a new score
            [restaurantId]: currentScore, // Simple revert, might need refinement
          }));
        },
      }
    );
  };

  const isVotingEnded = useMemo(
    () => new Date() > new Date(endTime),
    [endTime]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Vote for Restaurants</h2>
      {isVotingEnded && (
        <p className="text-red-500 font-medium">
          Voting has ended for this Food Fight.
        </p>
      )}
      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="p-4 border rounded-lg shadow-sm bg-card grid grid-cols-[1fr_1fr_4fr] justify-between"
          >
            <span>
              <h3 className="text-lg font-medium mb-2">{restaurant.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {restaurant.cuisine}
              </p>
            </span>
            <span>
              <AverageScoreDisplay
                foodFightId={foodFightId}
                restaurantId={restaurant.id}
              />
            </span>
            <div className="flex space-x-2 items-center justify-center">
              {Object.entries(scoreEmojis).map(([scoreValue, emoji]) => {
                const scoreNum = parseInt(scoreValue, 10);
                const scoreKey = `${restaurant.id}-${scoreNum}`;
                const isSelected = scores[restaurant.id] === scoreNum;
                const isSubmittingThis = submittingScore === scoreKey;

                return (
                  <Button
                    variant="ghost"
                    key={scoreValue}
                    onClick={() =>
                      !isVotingEnded &&
                      !isSubmittingThis &&
                      handleScoreChange(restaurant.id, scoreNum)
                    }
                    disabled={
                      isVotingEnded ||
                      isSubmittingThis ||
                      (isPending && !isSubmittingThis)
                    } // Disable buttons while *any* score is submitting, or specifically this one
                    className={`text-3xl p-2 rounded-full transition-transform transform hover:scale-110 cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 scale-110"
                        : "opacity-70 hover:opacity-100"
                    } ${
                      isVotingEnded || isSubmittingThis
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    } ${
                      isSubmittingThis ? "animate-pulse" : "" // Add pulse animation while submitting
                    }`}
                    aria-label={`Score ${scoreValue}`}
                  >
                    {emoji}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
