export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  link?: string | null;
  address?: string | null;
  google_place_id?: string | null;
}

