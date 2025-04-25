"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { getAllRestaurants } from "../../lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Restaurant } from '@/lib/types';
import useDebounce from "@/hooks/useDebounce";

// Define a type for the Google Place result structure we expect
interface GooglePlace {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  googleMapsUri: string;
  primaryTypeDisplayName?: {
    text: string;
    languageCode: string;
  };
}

interface NearbyApiResponse {
  places?: GooglePlace[];
  error?: string;
  details?: Record<string, unknown>; // Using Record<string, any> for details as Google API error structure can vary significantly
}

interface RestaurantSearchSelectProps {
  onSelect: (restaurant: Restaurant) => void;
  restaurants: Restaurant[]; // Already selected restaurants
}

export default function RestaurantSearchSelect({
  onSelect,
  restaurants,
}: RestaurantSearchSelectProps) {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const [nearbyRestaurants, setNearbyRestaurants] = useState<GooglePlace[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- Fetch Existing Restaurants ---
  useEffect(() => {
    const fetchExistingRestaurants = async () => {
      try {
        setIsLoadingExisting(true);
        const data = await getAllRestaurants();
        const availableRestaurants = data.filter(
          (restaurant) => !restaurants.some((r) => r.id === restaurant.id)
        );
        setAllRestaurants(availableRestaurants as Restaurant[]);
      } catch (error) {
        console.error("Error fetching existing restaurants:", error);
      } finally {
        setIsLoadingExisting(false);
      }
    };
    fetchExistingRestaurants();
  }, [restaurants]);

  // --- Fetch Nearby Restaurants (Debounced) ---
  useEffect(() => {
    const fetchNearby = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setNearbyRestaurants([]);
        setIsLoadingNearby(false);
        return;
      }

      setIsLoadingNearby(true);
      setNearbyRestaurants([]);

      try {
        const response = await fetch("/api/restaurants/nearby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: debouncedSearchTerm }),
        });

        if (!response.ok) {
          let errorData: NearbyApiResponse = { error: `HTTP error! status: ${response.status}` };
          try {
            errorData = await response.json();
          } catch (jsonError) {
             console.error("Failed to parse error JSON from Google API", jsonError);
          }
          console.error("Error fetching nearby restaurants:", errorData.details || errorData.error);
        } else {
             const data: NearbyApiResponse = await response.json();
             const existingNamesLower = new Set(allRestaurants.map(r => r.name.toLowerCase()));
             const uniqueNearby = data.places?.filter(place =>
               !existingNamesLower.has(place.displayName.text.toLowerCase())
             ) || [];
             setNearbyRestaurants(uniqueNearby);
        }

      } catch (error) {
        console.error("Failed to fetch nearby places:", error);
      } finally {
        setIsLoadingNearby(false);
      }
    };

    fetchNearby();
  }, [debouncedSearchTerm, allRestaurants]);

  // Filter Existing Restaurants Locally
  const filteredExistingRestaurants = allRestaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle Selection
  const handleSelect = useCallback((item: Restaurant | GooglePlace, isNearby: boolean) => {
    setIsOpen(false);
    setSearchTerm("");

    if (isNearby) {
      const place = item as GooglePlace;
      const newRestaurant: Partial<Restaurant> = {
        id: `google_${place.id}`,
        name: place.displayName.text,
        address: place.formattedAddress,
        link: place.googleMapsUri,
        cuisine: place.primaryTypeDisplayName?.text || "Unknown",
        google_place_id: place.id,
      };
      onSelect(newRestaurant as Restaurant);
    } else {
      onSelect(item as Restaurant);
    }

    inputRef.current?.blur();
  }, [onSelect]);


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  // Close popover if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverContentRef.current &&
        !popoverContentRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);


  return (
    <div className="relative mb-6">
      <Label htmlFor="restaurant-search" className="text-muted-foreground">
        Search existing or find nearby
      </Label>

      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative mt-1">
            <Input
              id="restaurant-search"
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search by name or cuisine..."
              autoComplete="off"
              className="pr-8"
              aria-autocomplete="list"
              aria-controls="restaurant-listbox"
              aria-expanded={isOpen}
            />
            {(isLoadingExisting || isLoadingNearby) && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          ref={popoverContentRef}
          id="restaurant-listbox"
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
          >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>
                {isLoadingExisting || isLoadingNearby
                  ? "Loading..."
                  : searchTerm
                  ? "No matching restaurants found."
                  : "Type to search."}
              </CommandEmpty>

              {Array.isArray(filteredExistingRestaurants) && (
                <CommandGroup heading="Existing Restaurants">
                  {filteredExistingRestaurants.map((restaurant) => (
                    <CommandItem
                      key={`existing-${restaurant.id}`}
                      value={`${restaurant.name} ${restaurant.cuisine}`}
                      onSelect={() => handleSelect(restaurant, false)}
                      className="cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-medium text-popover-foreground">
                        {restaurant.name}
                      </span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {restaurant.cuisine}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {Array.isArray(nearbyRestaurants) && (
                 <CommandGroup heading="Nearby Restaurants (Google)">
                   {nearbyRestaurants.map((place) => (
                     <CommandItem
                       key={`nearby-${place.id}`}
                       value={`${place.displayName.text} ${place.formattedAddress} ${place.primaryTypeDisplayName?.text}`}
                       onSelect={() => handleSelect(place, true)}
                       className="cursor-pointer flex flex-col items-start"
                     >
                       <span className="font-medium text-popover-foreground">
                         {place.displayName.text}
                       </span>
                       <span className="text-muted-foreground text-xs">
                         {place.primaryTypeDisplayName?.text || 'Restaurant'} - {place.formattedAddress}
                       </span>
                     </CommandItem>
                   ))}
                 </CommandGroup>
              )}

              {isLoadingNearby && debouncedSearchTerm.trim().length >= 2 && (
                  <div className="p-2 text-center text-sm text-muted-foreground flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching nearby...
                  </div>
              )}

               {searchTerm && !isLoadingExisting && !isLoadingNearby && filteredExistingRestaurants.length === 0 && nearbyRestaurants.length === 0 && (
                 <div className="p-2 text-center text-sm text-muted-foreground">
                   No results for &quot;{searchTerm}&quot;.
                 </div>
               )}

            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
