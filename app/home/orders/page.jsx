"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import { fetchPetsByBuyer } from '../../../firebase/firebase';

const PurchasedPetsPage = () => {
  const { userId } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPets = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }
        
        const petsData = await fetchPetsByBuyer(userId);
        setPets(petsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching pets:", err);
        setError("Failed to load your pets. Please try again later.");
        setLoading(false);
      }
    };

    loadPets();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your pets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">No Pets Found</h2>
          <p className="mt-2 text-gray-500">You haven't purchased any pets yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Purchased Pets</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64">
                {pet.media && pet.media.length > 0 && pet.media[0].resource_type === 'image' ? (
                  <img 
                    src={pet.media[0].url} 
                    alt={pet.breed} 
                    className="w-full h-full object-cover"
                  />
                ) : pet.media && pet.media.length > 0 && pet.media[0].resource_type === 'video' ? (
                  <video 
                    src={pet.media[0].url} 
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
                
                {pet.hasBadge && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold text-white px-2 py-1 rounded-full">
                    verified
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">{pet.breed}</h2>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    ₹{Number(pet.cost).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Age:</span> {pet.age} {parseInt(pet.age) === 1 ? 'year' : 'years'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Gender:</span> {pet.gender}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Color:</span> {pet.color}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Vaccinated:</span> {pet.vaccine || 'Unknown'}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                  </svg>
                  {pet.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PurchasedPetsPage;