'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import TournamentList from '../components/TournamentList';
import CreateTournamentForm from '../components/CreateTournamentForm';
import { useAuth } from '../auth-provider';

export default function TournamentsPage() {
  const { user, isLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Tournaments
          </h1>
          
          {user ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCreateForm ? 'Cancel' : 'Create Tournament'}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500"
            >
              Login to create tournaments
            </Link>
          )}
        </div>
        
        {user && showCreateForm && (
          <div className="mb-8">
            <CreateTournamentForm />
          </div>
        )}
        
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading...</p>
          </div>
        ) : !user ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view and create tournaments.
            </p>
          </div>
        ) : (
          <TournamentList />
        )}
      </main>
    </div>
  );
} 