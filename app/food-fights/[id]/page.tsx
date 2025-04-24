"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import Navbar from "@/app/components/Navbar";
import NominateRestaurantForm from "@/app/components/NominateRestaurantForm";
import RestaurantList from "@/app/components/RestaurantList";
import { ScoreVotingForm } from "@/app/components/ScoreVotingForm";
import { ResultsDisplay } from "@/app/components/ResultsDisplay";
import { FoodFightWinnerDisplay } from "@/app/components/FoodFightWinnerDisplay";
import { useAuth } from "@/app/auth-provider";
import { useFoodFight, useStartVoting, useCheckVotingEnd } from "@/lib/hooks/useFoodFights";
import { useParams } from "next/navigation";

export default function FoodFightDetailPage() {
  const params = useParams();
  const foodFightId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  const { data: foodFightData, isLoading, error: queryError } = useFoodFight(foodFightId);
  const [error, setError] = useState<string | null>(null);
  const startVotingMutation = useStartVoting(foodFightId);
  const checkVotingEndMutation = useCheckVotingEnd(foodFightId);

  useEffect(() => {
    if (foodFightData?.foodFight?.status === "voting") {
      const endTime = new Date(foodFightData.foodFight.end_time).getTime();
      if (Date.now() > endTime) {
        console.log("Voting end time passed, checking status...");
        checkVotingEndMutation.mutate(false); // Trigger check (force = false)
      } // else: Could implement a timer to check closer to end_time
    }
  }, [foodFightData, checkVotingEndMutation]);

  const handleStartVoting = async () => {
    try {
      await startVotingMutation.mutateAsync();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to start voting");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading Food Fight...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view Food Fights.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (queryError || error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error ||
              (queryError instanceof Error
                ? queryError.message
                : "Failed to load Food Fight")}
          </div>
        </main>
      </div>
    );
  }

  if (!foodFightData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Food Fight not found.</p>
          </div>
        </main>
      </div>
    );
  }

  const { foodFight, restaurants, winnerDetails, userScores, aggregateScores } = foodFightData;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {foodFight.name}
              </h1>
              <div className="text-gray-500">
                {foodFight.status === "nominating" && "Nomination Phase"}
                {foodFight.status === "voting" && "Voting Phase"}
                {foodFight.status === "completed" && "Food Fight Complete"}
              </div>
            </div>

            {foodFight.status === "nominating" && (
              <button
                onClick={handleStartVoting}
                disabled={
                  startVotingMutation.isPending || restaurants.length < 2
                }
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {startVotingMutation.isPending ? "Starting..." : "Start Voting"}
              </button>
            )}
          </div>
        </div>

        {foodFight.status === "nominating" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <NominateRestaurantForm foodFightId={foodFightId} />
            </div>
            <div>
              <RestaurantList
                restaurants={restaurants}
                foodFightId={foodFightId}
              />
            </div>
          </div>
        )}

        {foodFight.status === "voting" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Vote for Restaurants (1-5 Score)
            </h2>
            <p className="text-gray-600 mb-4">
              Voting ends at: {new Date(foodFight.end_time).toLocaleString()}
            </p>
            <ScoreVotingForm
              foodFightId={foodFightId}
              restaurants={restaurants}
              userScores={userScores}
              endTime={foodFight.end_time}
            />
          </div>
        )}

        {foodFight.status === "completed" && (
          <div className="space-y-8">
            {winnerDetails && (
              <div>
                <FoodFightWinnerDisplay winner={winnerDetails} />
              </div>
            )}
            {aggregateScores && aggregateScores.length > 0 && (
              <div>
                <ResultsDisplay results={aggregateScores} />
              </div>
            )}
            {!winnerDetails &&
              (!aggregateScores || aggregateScores.length === 0) && (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                  Food Fight completed, but no winner or scores found.
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
