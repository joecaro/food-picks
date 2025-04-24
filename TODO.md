# Project TODO List

This list tracks the remaining tasks for implementing the Score Voting feature.

## UI Component Implementation

- [X] **Create `ScoreVotingForm` component (`app/components/ScoreVotingForm.tsx`)**
    - Props: `foodFightId`, `restaurants`, `userScores`, `endTime`.
    - Display each restaurant from the `restaurants` prop.
    - For each restaurant, allow the user to select a score from 1 to 5 (e.g., using radio buttons, stars, or the suggested emojis).
    - Show the user's previously submitted score (from `userScores`) if available.
    - Use the `useSubmitScores` hook to send the score payload `{ restaurant_id, score }` to the API.
    - Handle loading and error states from the mutation.
    - Consider disabling the form after `endTime`.

- [X] **Create `ResultsDisplay` component (`app/components/ResultsDisplay.tsx`)**
    - Props: `results` (the `aggregateScores` array).
    - Display a ranked list of restaurants based on the `average_score` in the `results` prop.
    - Show the restaurant name, cuisine, average score (formatted), and vote count for each.

- [X] **Create `FoodFightWinnerDisplay` component (`app/components/FoodFightWinnerDisplay.tsx`)**
    - Props: `winner` (the `winnerDetails` object).
    - Display the details of the winning restaurant (name, cuisine).
    - Style it appropriately.

## Integration

- [X] **Integrate new components into `app/food-fights/[id]/page.tsx` (to be renamed)**
    - Update imports for the new/renamed components.
    - Replace placeholder elements with the actual components, passing the required props.

## Cleanup

- [X] **Remove old/unused components:**
    - `app/components/TournamentBracket.tsx`
    - `app/components/CustomTournamentBracket.tsx`
    - `app/components/VotingCard.tsx`

## Refactoring (Completed - Pending Manual Steps)

- [X] Rename "tournament" to "Food Fight" throughout codebase:
    - [X] UI Text
    - [X] Documentation (TODO, DESIGN, README)
    - [X] Code Identifiers (variables, functions, hooks)
    - [X] Component Names/Files (Manual rename required)
    - [X] Hook Files (`useFoodFights.ts`) (Manual rename required)
    - [X] Page Files/Folders (`app/food-fights/`) (Manual rename required)
    - [X] API Functions/Types (`lib/api.ts`)
    - [X] Database Schema (`lib/schema.sql`) (Manual migration required)
    - [X] Supabase Types (`lib/supabase.ts`)

## Optional Enhancements

- [ ] Implement a timer in `app/food-fights/[id]/page.tsx` to trigger `checkVotingEnd` automatically closer to the `endTime`.
- [X] Add optimistic updates to the `useSubmitScores` hook.
- [ ] Refine tie-breaking logic in `calculateWinner` (API) if needed.
- [X] Implement emoji display for scores (1-5) in `ScoreVotingForm`. 