"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth-provider";
import { useFoodFightsList } from "../../lib/hooks/useFoodFights";
import CreateFoodFightForm from "../components/CreateFoodFightForm";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
export default function FoodFightsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { data: foodFights, isLoading, error } = useFoodFightsList();

  useEffect(() => {
    const handleDBChange = (payload: unknown) => {
      console.log("Database change received!", payload);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodFights() });  
    };

    const channel = supabase.channel("food-fights");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "food_fights" },
      handleDBChange
    );
  }, [foodFights, queryClient]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Food Fights</h1>

          {user ? (
            <CreateFoodFightForm />
          ) : (
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Login to create Food Fights
            </Link>
          )}
        </div>

        {authLoading || isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading...</p>
          </div>
        ) : !user ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view and create Food Fights.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error instanceof Error
              ? error.message
              : "Failed to load Food Fights"}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Food Fights</h2>

            {foodFights && foodFights.length > 0 ? (
              <div className="space-y-3">
                {foodFights.map((foodFight) => (
                  <Link
                    href={`/food-fights/${foodFight.id}`}
                    key={foodFight.id}
                    className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{foodFight.name}</div>
                        <div className="text-sm text-gray-500">
                          {foodFight.status === "nominating" &&
                            "Nomination Phase"}
                          {foodFight.status === "voting" && `Voting Phase`}
                          {foodFight.status === "completed" && "Completed"}
                        </div>
                      </div>
                      <div>
                        {foodFight.status === "completed" &&
                          foodFight.winner && (
                            <div className="text-sm">
                              <span className="font-medium">Winner:</span>{" "}
                              <span className="text-green-600">
                                {foodFight.winner.name}
                              </span>
                            </div>
                          )}
                        {foodFight.status !== "completed" && (
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              foodFight.status === "nominating"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {foodFight.status === "nominating"
                              ? "Nominating"
                              : "Voting"}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No Food Fights found. Create one to get started!
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
