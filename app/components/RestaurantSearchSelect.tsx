"use client";

import { useState, useEffect, useRef } from "react";
import { getAllRestaurants } from "../../lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Restaurant } from '@/lib/types';

interface RestaurantSearchSelectProps {
  onSelect: (restaurant: Restaurant) => void; // Use imported type
  restaurants: Restaurant[];
}

export default function RestaurantSearchSelect({
  onSelect,
  restaurants,
}: RestaurantSearchSelectProps) {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]); // Store all fetched restaurants
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await getAllRestaurants();
        const filteredData = data.filter(
          (restaurant) => !restaurants.some((r) => r.link === restaurant.link)
        );
        setAllRestaurants(filteredData as Restaurant[]);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []); // Run only once on mount

  // Filter based on search term
  const filteredRestaurants = allRestaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || filteredRestaurants.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(
            (prevIndex) => (prevIndex + 1) % filteredRestaurants.length // Cycle through
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prevIndex) =>
              (prevIndex - 1 + filteredRestaurants.length) %
              filteredRestaurants.length // Cycle through
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelect(filteredRestaurants[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // Depend on filteredRestaurants to reset selection correctly on filter change
  }, [isOpen, selectedIndex, filteredRestaurants]);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      const listElement = dropdownRef.current?.querySelector(
        'div[role="listbox"]'
      );
      const selectedElement = listElement?.children[
        selectedIndex
      ] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = (restaurant: Restaurant) => {
    setIsOpen(false);
    onSelect(restaurant); // Send full selected restaurant object
    setSearchTerm(""); // Clear search after selection
    inputRef.current?.blur(); // Unfocus input
  };

  return (
    <div className="relative mb-6" ref={dropdownRef}>
      <Label htmlFor="restaurant-search" className="text-muted-foreground">
        Select existing or type to add new
      </Label>

      <div className="relative mt-1">
        <Input
          id="restaurant-search"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search restaurants..."
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="restaurant-listbox"
          aria-expanded={isOpen}
          aria-activedescendant={
            selectedIndex >= 0 ? `option-${selectedIndex}` : undefined
          }
        />

        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <div
          id="restaurant-listbox"
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-popover shadow-lg max-h-60 rounded-md py-1 text-sm overflow-auto border border-border"
        >
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant, index) => (
              <div
                id={`option-${index}`}
                key={restaurant.id} // Use unique ID
                role="option"
                aria-selected={selectedIndex === index}
                className={`px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center ${
                  selectedIndex === index ? "bg-accent" : ""
                }`}
                onClick={() => handleSelect(restaurant)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="font-medium text-popover-foreground">
                  {restaurant.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {restaurant.cuisine}
                </span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted-foreground">
              {isLoading
                ? "Loading..."
                : searchTerm
                ? "No matching restaurants"
                : "No restaurants found"}
            </div>
          )}
        </div>
      )}

      {/* Keep hint for adding new */}
      {/* <div className="mt-1 text-sm text-muted-foreground">
        {searchTerm ? 'Press Enter to add as new restaurant' : 'Start typing to search existing restaurants'}
      </div> */}
    </div>
  );
}
