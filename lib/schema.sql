-- prerequisites -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;         -- gen_random_uuid()

-- status enum ---------------------------------------------------------------
CREATE TYPE food_fight_status AS ENUM ('nominating','voting','completed');

-- core tables ---------------------------------------------------------------
CREATE TABLE food_fights (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text                  NOT NULL,
  status         food_fight_status     NOT NULL DEFAULT 'nominating',
  creator_id     uuid                  NOT NULL,           -- auth/user id
  end_time       timestamptz           NOT NULL,
  winner         uuid,                                   -- FK added later
  created_at     timestamptz           NOT NULL DEFAULT now()
);

CREATE TABLE restaurants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_fight_id uuid        NOT NULL
                REFERENCES food_fights(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  cuisine       text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- add the circular FK now that restaurants exists
ALTER TABLE food_fights
  ADD CONSTRAINT food_fights_winner_fk
  FOREIGN KEY (winner) REFERENCES restaurants(id);

CREATE INDEX restaurants_by_food_fight
  ON restaurants(food_fight_id);

CREATE TABLE scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Or use composite PK
  food_fight_id uuid NOT NULL REFERENCES food_fights(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL, -- Assuming users are managed elsewhere (e.g., auth.users)
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  score         smallint NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (food_fight_id, user_id, restaurant_id) -- Ensure one score per user per restaurant
);

CREATE INDEX scores_by_food_fight_user
  ON scores(food_fight_id, user_id);

CREATE INDEX scores_by_restaurant
  ON scores(restaurant_id);


-- Dropping old tables and indices related to matches/votes
DROP INDEX IF EXISTS matches_by_tournament_round;
DROP TABLE IF EXISTS matches;

DROP INDEX IF EXISTS votes_by_match_user;
DROP TABLE IF EXISTS votes;


-- You might need to adjust your application logic to handle the absence
-- of 'matches' and the new 'scores' table structure.
-- Also ensure user_id refers to your actual user authentication table/system.

-- Example of querying scores (needs adaptation for your specific auth setup):
-- SELECT
--   r.name,
--   AVG(s.score) as average_score
-- FROM scores s
-- JOIN restaurants r ON s.restaurant_id = r.id
-- WHERE s.food_fight_id = 'your_food_fight_uuid'
-- GROUP BY r.id, r.name
-- ORDER BY average_score DESC;