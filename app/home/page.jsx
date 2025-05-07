// pages/pet-marketplace.js
"use client"
import { useState, useEffect } from 'react';
import { CheckCircle, Search, Filter, Medal, ArrowUp, ArrowDown } from 'lucide-react';
import { MapPin, Calendar, PawPrint, Heart, Volume2, VolumeX,ShieldCheck  } from 'lucide-react';

import Image from 'next/image';
import { getPetData } from '../../firebase/firebase';
import Link from 'next/link';

export default function PetMarketplace() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    breed: '',
    gender: '',
    minCost: '',
    maxCost: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Function to determine if media is a video
  const isVideo = (url) => {
    return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm');
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const petData = await getPetData();
      setPets(petData);
    } catch (error) {
      console.error('Error fetching pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort function for pets array
  const sortPets = (petsToSort) => {
    return [...petsToSort].sort((a, b) => {
      if (sortConfig.key === 'cost') {
        const aValue = Number(a[sortConfig.key]);
        const bValue = Number(b[sortConfig.key]);
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      return 0;
    });
  };

  // Handle sort change
  const handleSortChange = () => {
    setSortConfig({
      key: 'cost',
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Apply all filters to pets client-side
 const filterPets = () => {
    let filtered = [...pets];
  
  console.log("🔍 Initial pets:", filtered.length);
  
  // Separate pets with badges from those without
  const withBadges = filtered.filter(pet => pet.hasBadge === true);
  const withoutBadges = filtered.filter(pet => pet.hasBadge !== true);
  
  // Shuffle the pets without badges
  for (let i = withoutBadges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [withoutBadges[i], withoutBadges[j]] = [withoutBadges[j], withoutBadges[i]];
  }
  
  // Combine the two arrays: badged pets first, then shuffled non-badged pets
  filtered = [...withBadges, ...withoutBadges];
  
  console.log("✅ Sorted pets:", filtered.length);
  console.log("🏅 Pets with badges:", withBadges.length);

  // Apply search term filter
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(pet => {
      const match =
        pet.breed?.toLowerCase().includes(term) ||
        pet.location?.toLowerCase().includes(term);
      if (!match) console.log("❌ Filtered out (searchTerm):", pet);
      return match;
    });
    console.log("✅ After searchTerm filter:", filtered.length);
  }

  // Apply breed filter
  if (filters.breed) {
    const breed = filters.breed.toLowerCase();
    filtered = filtered.filter(pet => {
      const match = pet.breed?.toLowerCase().includes(breed);
      if (!match) console.log("❌ Filtered out (breed):", pet);
      return match;
    });
    console.log("✅ After breed filter:", filtered.length);
  }

  // Apply gender filter
  if (filters.gender) {
    const gender = filters.gender.toLowerCase();
    filtered = filtered.filter(pet => {
      const match = pet.gender?.toLowerCase() === gender;
      if (!match) console.log("❌ Filtered out (gender):", pet);
      return match;
    });
    console.log("✅ After gender filter:", filtered.length);
  }

  // Apply minCost filter
  if (filters.minCost !== '') {
    const min = Number(filters.minCost);
    filtered = filtered.filter(pet => {
      const match = Number(pet.cost) >= min;
      if (!match) console.log("❌ Filtered out (minCost):", pet);
      return match;
    });
    console.log("✅ After minCost filter:", filtered.length);
  }

  // Apply maxCost filter
  if (filters.maxCost !== '') {
    const max = Number(filters.maxCost);
    filtered = filtered.filter(pet => {
      const match = Number(pet.cost) <= max;
      if (!match) console.log("❌ Filtered out (maxCost):", pet);
      return match;
    });
    console.log("✅ After maxCost filter:", filtered.length);
  }

  // Log before and after sorting
  console.log("⚙️ Before sorting:", filtered.map(p => p.breed));
  const sorted = sortPets(filtered);
  console.log("✅ After sorting:", sorted.map(p => p.breed));

  return sorted;
};

  // Filter and sort the pets
  const filteredAndSortedPets = filterPets();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by breed or location..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              type="button"
              onClick={handleSortChange}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Price {sortConfig.direction === 'asc' ? 
                <ArrowUp className="h-4 w-4 ml-2" /> : 
                <ArrowDown className="h-4 w-4 ml-2" />}
            </button>
          </form>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-4 bg-white p-4 rounded-md shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Breed</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.breed}
                    onChange={(e) => setFilters({...filters, breed: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value})}
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Price</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.minCost}
                    onChange={(e) => setFilters({...filters, minCost: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Price</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={filters.maxCost}
                    onChange={(e) => setFilters({...filters, maxCost: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    searchTerm: '',
                    breed: '',
                    gender: '',
                    minCost: '',
                    maxCost: '',
                  })}
                  className="mr-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pet Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading pets...</p>
          </div>
        ) : filteredAndSortedPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No pets found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPets.map((pet) => (
              <Link href={`/pets/${pet.id}`} className="block">
  <div key={pet.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    {/* Pet Image */}
    <div className="relative h-72 w-full overflow-hidden rounded-lg">
      {pet.media && pet.media.length > 0 ? (
        <div className="relative h-full w-full">
          {isVideo(pet.media[0].url) ? (
            <div className="relative h-full w-full">
              <video
                src={pet.media[0].url}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                autoPlay
                loop
                muted={isMuted}
                playsInline
              />
              {/* Audio toggle button */}
              <button 
                onClick={(e) => {
                  e.preventDefault(); // Prevent Link navigation when clicking button
                  setIsMuted(!isMuted);
                }}
                className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white rounded-full p-2 hover:bg-opacity-80 transition-all"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <Image
              src={pet.media[0].url}
              alt={`${pet.breed}`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          )}
          {pet.media.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white rounded-lg px-2 py-1 text-xs font-medium">
              +{pet.media.length - 1} {isVideo(pet.media[0].url) ? 'media' : 'photos'}
            </div>
          )}
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100">
          <PawPrint className="h-12 w-12 text-gray-300 mb-2" />
          <span className="text-gray-400 text-sm">No media available</span>
        </div>
      )}
    </div>

    {/* Pet Info */}
    <div className="p-5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800 tracking-tight">{pet.breed}</h3>
        <div className="flex items-center">
          {pet.hasBadge && (
            <span className="inline-flex items-center bg-green-50 px-2 py-1 rounded-full text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </span>
          )}
        </div>
      </div>

     <div className="space-y-2 mb-4">
  {/* Gender */}
  <div className="flex items-center text-gray-600">
    <div className="flex justify-center items-center w-4 h-4 mr-2 text-indigo-500 font-bold">
      {pet.gender === 'male' ? '♂' : '♀'}
    </div>
    <span className="text-sm">{pet.gender}</span>
  </div>

  {/* Age */}
  <div className="flex items-center text-gray-600">
    <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
    <span className="text-sm">{pet.age} Years</span>
  </div>

  {/* Vaccination Status */}
  <div className="flex items-center text-gray-600">
    <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />
    <span className="text-sm">{pet.vaccine === "Yes" ? 'Vaccinated' : 'Not Vaccinated'}</span>
  </div>

  {/* Location */}
  <div className="flex items-center text-gray-600">
    <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
    <span className="text-sm">{pet.location}</span>
  </div>
</div>


      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <p className="text-xl font-bold text-indigo-600">₹{pet.cost}</p>
      </div>
    </div>
  </div>
</Link>

            
            ))}
          </div>
        )}
      </main>
    </div>
  );
}