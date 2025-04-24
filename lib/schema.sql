-- prerequisites -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;         -- gen_random_uuid()

-- status enum ---------------------------------------------------------------
CREATE TYPE tournament_status AS ENUM ('nominating','voting','completed');

-- core tables ---------------------------------------------------------------
CREATE TABLE tournaments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text                  NOT NULL,
  status         tournament_status     NOT NULL DEFAULT 'nominating',
  creator_id     uuid                  NOT NULL,           -- auth/user id
  current_round  int                   NOT NULL DEFAULT 1,
  end_time       timestamptz           NOT NULL,
  winner         uuid,                                   -- FK added later
  created_at     timestamptz           NOT NULL DEFAULT now()
);

CREATE TABLE restaurants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid        NOT NULL
                REFERENCES tournaments(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  cuisine       text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- add the circular FK now that restaurants exists
ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_winner_fk
  FOREIGN KEY (winner) REFERENCES restaurants(id);

CREATE INDEX restaurants_by_tournament
  ON restaurants(tournament_id);

CREATE TABLE matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid  NOT NULL
                REFERENCES tournaments(id) ON DELETE CASCADE,
  round         int   NOT NULL,
  restaurant1   uuid  NOT NULL REFERENCES restaurants(id),
  restaurant2   uuid          REFERENCES restaurants(id),
  votes1        int   NOT NULL DEFAULT 0,
  votes2        int   NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX matches_by_tournament_round
  ON matches(tournament_id, round);

CREATE TABLE votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES matches(id)      ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)      -- “already voted” guard
);

CREATE INDEX votes_by_match_user
  ON votes(match_id, user_id);

make.