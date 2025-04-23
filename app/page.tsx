import Link from 'next/link';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Food Picks
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Tournament-style voting to decide where to eat for lunch
          </p>
          
          <div className="bg-white p-8 max-w-3xl mx-auto rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">How it works:</h2>
            
            <ol className="list-decimal list-inside space-y-4 text-left text-gray-700">
              <li>
                <span className="font-medium">Create a tournament</span>
                <p className="ml-6 text-gray-600">
                  Start a new tournament and give it a name like &quot;Friday Lunch&quot; or &quot;Team Dinner&quot;.
                </p>
              </li>
              <li>
                <span className="font-medium">Nominate restaurants</span>
                <p className="ml-6 text-gray-600">
                  Everyone has 2 minutes to nominate their favorite lunch spots.
                </p>
              </li>
              <li>
                <span className="font-medium">Vote in bracket-style rounds</span>
                <p className="ml-6 text-gray-600">
                  Restaurants compete head-to-head in a tournament bracket. Each voting round lasts 2 minutes.
                </p>
              </li>
              <li>
                <span className="font-medium">Declare a winner</span>
                <p className="ml-6 text-gray-600">
                  The last restaurant standing is where you&apos;ll be having lunch!
                </p>
              </li>
            </ol>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
              <Link
                href="/tournaments"
                className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
              >
                View Tournaments
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto border border-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
