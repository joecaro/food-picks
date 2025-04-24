'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllRestaurants } from '../../lib/api';

interface Restaurant {
  name: string;
  cuisine: string;
}

interface RestaurantSearchSelectProps {
  onSelect: (restaurant: Restaurant) => void;
  selectedRestaurants: Restaurant[];
}

export default function RestaurantSearchSelect({ onSelect, selectedRestaurants }: RestaurantSearchSelectProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate filtered restaurants early
  const filteredRestaurants = restaurants.filter(
    restaurant => 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await getAllRestaurants();
        const filteredData = data.filter(
          (restaurant: Restaurant) =>
            !selectedRestaurants.some(
              (selected: Restaurant) => selected.name === restaurant.name
            )
        );
        setRestaurants(filteredData as Restaurant[]);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prevIndex => 
            prevIndex < filteredRestaurants.length - 1 ? prevIndex + 1 : prevIndex
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredRestaurants.length) {
            handleSelect(filteredRestaurants[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, filteredRestaurants]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  const handleSelect = (restaurant: Restaurant) => {
    setIsOpen(false);
    onSelect(restaurant);
    setSearchTerm('');
  };

  return (
    <div className="relative mb-6" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select an existing restaurant or add a new one
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search restaurants..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto border border-gray-200">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant, index) => (
              <div
                key={`${restaurant.name}-${index}`}
                className={`px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between ${
                  selectedIndex === index ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelect(restaurant)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="font-medium">{restaurant.name}</span>
                <span className="text-gray-500 text-sm">{restaurant.cuisine}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">
              {searchTerm ? 'No matching restaurants found' : 'No restaurants found'}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-1 text-sm text-gray-500">
        {searchTerm ? 'Press Enter to add as new restaurant' : 'Start typing to search existing restaurants'}
      </div>
    </div>
  );
} 