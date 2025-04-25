"use client";

import { useState, useEffect, useMemo } from "react";
import { useSubmitScores } from "@/lib/hooks/useFoodFights";
import { Button } from "@/components/ui/button";
import { AverageScoreDisplay } from "./AverageScoreDisplay";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Link as LinkIcon } from "lucide-react";

// Update interface to include link
interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  link?: string | null; // Add link field
}

// Define UserScore type inline - align with DB schema (string id)
type UserScore = { restaurant_id: string; score: number };

interface ScoreVotingFormProps {
  foodFightId: string;
  restaurants: Restaurant[]; // Expect full Restaurant type
  userScores?: UserScore[]; // Scores previously submitted by the user
  endTime: string | Date;
}

// Define emojis for scores 1 to 5 with more contextual descriptions
const scoreEmojis = {
  1: { emoji: "🤢", label: "No way" },
  2: { emoji: "🤔", label: "Meh" },
  3: { emoji: "😐", label: "It's ok" },
  4: { emoji: "😋", label: "Yum!" },
  5: { emoji: "🤩", label: "Amazing!" },
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
    submitScore(
      { restaurant_id: restaurantId, score: score },
      {
        onSettled: () => {
          setSubmittingScore(null);
        },
        onError: (err) => {
          console.error("Error submitting score:", err);
          setScores((prevScores) => ({
            ...prevScores,
            [restaurantId]: currentScore,
          }));
        },
      }
    );
  };

  const isVotingEnded = useMemo(
    () => new Date() > new Date(endTime),
    [endTime]
  );

  // Animation variants for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: { 
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  // Animation variants for emoji buttons
  const emojiButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.15, transition: { type: "spring", stiffness: 400 } },
    tap: { scale: 0.95 },
    selected: { 
      scale: 1.2,
      y: -4,
      transition: { type: "spring", stiffness: 300, damping: 10 } 
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rate the Food</h2>
        {isVotingEnded && (
          <Badge variant="destructive" className="text-sm py-1 px-3">
            Voting closed
          </Badge>
        )}
      </div>
      
      <motion.div 
        className="grid gap-6 sm:grid-cols-1 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {restaurants.map((restaurant) => (
          <motion.div 
            key={restaurant.id}
            variants={cardVariants}
            whileHover={!isVotingEnded ? "hover" : undefined}
            layoutId={`restaurant-${restaurant.id}`}
            className="h-full"
          >
            <Card className="h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    {/* Add Link Icon */}
                    {restaurant.link && (
                      <a 
                        href={restaurant.link}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary shrink-0 mt-1.5" // Added mt-1.5 for alignment
                        aria-label={`View ${restaurant.name} on external site`}
                        onClick={(e) => e.stopPropagation()} // Prevent card hover effect triggering
                      >
                        <LinkIcon size={14} />
                      </a>
                    )}
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold line-clamp-1">{restaurant.name}</h3>
                      <div className="flex items-center text-muted-foreground">
                        <Utensils size={14} className="mr-1.5" />
                        <span className="text-sm">{restaurant.cuisine}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <AverageScoreDisplay
                      foodFightId={foodFightId}
                      restaurantId={restaurant.id}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mt-2">
                  <div className="flex flex-col space-y-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      {scores[restaurant.id] 
                        ? `Your rating: ${scoreEmojis[scores[restaurant.id] as keyof typeof scoreEmojis].label}`
                        : "How do you rate this place?"}
                    </p>
                    <div className="flex justify-between items-center">
                      {Object.entries(scoreEmojis).map(([scoreValue, { emoji, label }]) => {
                        const scoreNum = parseInt(scoreValue, 10);
                        const scoreKey = `${restaurant.id}-${scoreNum}`;
                        const isSelected = scores[restaurant.id] === scoreNum;
                        const isSubmittingThis = submittingScore === scoreKey;

                        return (
                          <motion.div
                            key={scoreValue}
                            initial="initial"
                            whileHover={!isVotingEnded && !isSubmittingThis ? "hover" : undefined}
                            whileTap={!isVotingEnded && !isSubmittingThis ? "tap" : undefined}
                            animate={isSelected ? "selected" : "initial"}
                            variants={emojiButtonVariants}
                            className="flex flex-col items-center"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                !isVotingEnded &&
                                !isSubmittingThis &&
                                handleScoreChange(restaurant.id, scoreNum)
                              }
                              disabled={
                                isVotingEnded ||
                                isSubmittingThis ||
                                (isPending && !isSubmittingThis)
                              }
                              className={`text-2xl sm:text-3xl rounded-full h-10 w-10 sm:h-12 sm:w-12 ${
                                isSelected
                                  ? "bg-primary/10 text-primary"
                                  : "opacity-70 hover:opacity-100"
                              } ${
                                isVotingEnded
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              } ${
                                isSubmittingThis ? "animate-pulse" : ""
                              }`}
                              aria-label={`Score ${scoreValue}: ${label}`}
                            >
                              {emoji}
                            </Button>
                            <span className={`mt-1 text-xs ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
