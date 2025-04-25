import Link from 'next/link';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Food Picks
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Vote on where to eat for lunch!
          </p>
          
          <div className="bg-background p-8 max-w-3xl mx-auto rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">How it works:</h2>
            
            <ol className="list-decimal list-inside space-y-4 text-left text-muted-foreground">
              <li>
                <span className="font-medium">Start a Food Fight</span>
                <p className="ml-6 text-muted-foreground">
                  Start a new Food Fight and give it a name like &quot;Friday Lunch&quot; or &quot;Team Dinner&quot;.
                </p>
              </li>
              <li>
                <span className="font-medium">Nominate restaurants</span>
                <p className="ml-6 text-muted-foreground">
                Add your favorite restaurants to the Food Fight.
                </p>
              </li>
              <li>
                <span className="font-medium">Vote using scores</span>
                <p className="ml-6 text-muted-foreground">
                  Rate each nominated restaurant on a scale of 1 (🤢) to 5 (🤩) within the voting time window.
                </p>
              </li>
              <li>
                <span className="font-medium">See the winner</span>
                <p className="ml-6 text-muted-foreground">
                  The restaurant with the highest average score wins!
                </p>
              </li>
            </ol>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
              <Link
                href="/food-fights"
                className="w-full sm:w-auto bg-primary text-primary-foreground py-3 px-6 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-center"
              >
                View Food Fights
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto border border-border text-muted-foreground py-3 px-6 rounded-md hover:bg-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
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
