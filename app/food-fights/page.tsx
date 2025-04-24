"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth-provider";
import CreateFoodFightForm from "../components/CreateFoodFightForm";
import FoodFightList from "../components/FoodFightList";

export default function FoodFightsPage() {
  const { user, isLoading: authLoading } = useAuth();

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

        {authLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading...</p>
          </div>
        ) : !user ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view and create Food Fights.
            </p>
          </div>
        ) : (
          <FoodFightList />
        )}
      </main>
    </div>
  );
}
