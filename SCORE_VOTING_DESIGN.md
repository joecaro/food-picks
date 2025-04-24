# Design Document: Score Voting for Restaurant Selection

## 1. Goal

To replace the existing synchronous, bracket-style restaurant selection mechanism with an asynchronous score-based voting system, allowing users to participate on their own schedule within a "Food Fight".

## 2. Problem

The previous system required all participants to be available simultaneously for voting rounds, making coordination difficult and potentially excluding users who couldn't participate live.

## 3. Proposed Solution: Score Voting within a "Food Fight"

Implement a score voting system where:
*   A "Food Fight" is created (e.g., for a specific lunch day).
*   Users are presented with the list of nominated restaurants within that Food Fight.
*   Each user rates each restaurant on a scale of 1 to 5.
*   Voting occurs asynchronously within a defined time window (`end_time`) set for the Food Fight.
*   After the voting period ends, the system calculates the average score for each restaurant.
*   The restaurant with the highest average score is declared the winner of the Food Fight.

This approach allows asynchronous participation and captures the intensity of preference.

## 4. Database Changes (`lib/schema.sql` - Requires Migration)

*   **Rename:** `tournaments` table to `food_fights`.
*   **Rename:** `tournament_id` column to `food_fight_id` in `restaurants` and `scores` tables.
*   **Removed (Previously):**
    *   `matches` table and its index (`matches_by_tournament_round`).
    *   `votes` table and its index (`votes_by_match_user`).
    *   `current_round` column from the `tournaments` (now `food_fights`) table.
*   **Added (Previously):**
    *   `scores` table to store individual user ratings for each restaurant in a Food Fight.
        *   Columns: `id`, `food_fight_id`, `user_id`, `restaurant_id`, `score` (smallint 1-5), `created_at`.
        *   Constraint: `UNIQUE (food_fight_id, user_id, restaurant_id)`.
        *   Indices: `scores_by_food_fight_user`, `scores_by_restaurant`.

*   **Modified (Previously):**
    *   `tournaments` (now `food_fights`) table: Removed `current_round`.

*(Note: Renaming tables/columns requires executing `ALTER TABLE` commands against the database.)*

## 5. API Changes (`lib/api.ts`)

*   **Rename:** `createTournament` to `createFoodFight`, `copyTournament` to `copyFoodFight`, `getTournament` to `getFoodFight`, etc.
*   **Modified (Previously):** Removed `current_round` handling.
*   **Modified `startVoting`:** Removed logic for creating matches. Now simply updates Food Fight status to 'voting' and sets `end_time`.
*   **Modified `submitScores`:** Accepts `foodFightId` and a single score object `{ restaurant_id, score }`. Upserts the score into the `scores` table for the current user.
*   **Added `calculateWinner`:** Fetches all scores for a Food Fight, calculates the average score per restaurant, determines the restaurant with the highest average, and updates the Food Fight status to 'completed' and sets the `winner` ID.
*   **Modified `checkVotingEnd`:** When `end_time` is reached (or forced), it now calls `calculateWinner`.
*   **Modified `getFoodFight` (renamed from `getTournament`):**
    *   Removed fetching/processing of old `matches` and `votes`.
    *   Returns the user's individual scores (`userScores`) for the Food Fight.
    *   Calculates and returns aggregate scores (`aggregateScores`) sorted by average score if status is 'completed'.
    *   Returns `winnerDetails` based on the `winner` ID in the `food_fights` table.
*   **Removed (Previously):** `vote`, `advanceRound` functions.

## 6. UI Changes

*   **Main Page (`app/food-fights/[id]/page.tsx` - Renamed):**
    *   Conditionally renders UI based on `foodFight.status`.
    *   Removed `TournamentBracket` and `CustomTournamentBracket`.
    *   Uses `useCheckVotingEnd` hook to trigger winner calculation.
    *   Uses `ScoreVotingForm` when status is 'voting'.
    *   Uses `FoodFightWinnerDisplay` (renamed) and `ResultsDisplay` when status is 'completed'.
*   **New Components (Created/Renamed):**
    *   `ScoreVotingForm`: Displays restaurants, allows 1-5 score input, uses `useSubmitScores` hook (optimistic updates).
    *   `ResultsDisplay`: Shows a ranked list of restaurants based on `aggregateScores`.
    *   `FoodFightWinnerDisplay` (Renamed from `TournamentWinnerDisplay`): Shows the winning restaurant details.
*   **Hooks (`lib/hooks/useFoodFights.ts` - Renamed):**
    *   Updated `FoodFightData` type (renamed from `TournamentData`) to match API (`GetFoodFightResult` - renamed).
    *   Modified `useSubmitScores` hook (optimistic updates, single score).
    *   Renamed other hooks: `useFoodFightsList`, `useFoodFight`, `useCreateFoodFight`, etc.
    *   Removed `useVote` hook.

## 7. User Flow

1.  **Setup:** User creates a Food Fight, users nominate restaurants (`status: 'nominating'`).
2.  **Voting:** Admin starts voting (`status: 'voting'`). Users visit the page, see the `ScoreVotingForm`, and submit their 1-5 scores for each restaurant before `end_time`.
3.  **Completion:** After `end_time` passes, `checkVotingEnd` triggers `calculateWinner`. The status becomes 'completed'.
4.  **Results:** Users visiting the page see the `FoodFightWinnerDisplay` and the `ResultsDisplay` showing the final rankings. 