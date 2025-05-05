"use client"
import React, { useState, useEffect } from 'react';
import { Heart, X, MessageCircle, Image, Calendar, User, PawPrint, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { useAuth } from "@clerk/nextjs";

import { getAllPetDatingProfiles, likeDog } from '../../../firebase/firebase';


// Main PetDating App Component
export default function PetDatingApp() {
      const { userId, isSignedIn } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch pet profiles from Firebase
    const fetchPetProfiles = async () => {
      try {
        setLoading(true);
        // This is where you would use your imported getPetDatingProfile function
        // For now we'll assume it returns an array of profiles
        const fetchedProfiles = await getAllPetDatingProfiles(userId);
        setProfiles(fetchedProfiles);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching pet profiles:", err);
        setError("Failed to load pet profiles. Please try again later.");
        setLoading(false);
      }
    };

    fetchPetProfiles();
  }, []);

  const handleLike = () => {
    // In a real app, you would send this like to your backend
    likeDog(userId,currentProfile.id)
    goToNextProfile();
  };

  const handleDislike = () => {
    // In a real app, you would record this dislike
    console.log(`Disliked ${profiles[currentProfileIndex]?.petName}`);
    goToNextProfile();
  };

  const goToNextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      // Reset or show "no more profiles" message
      setCurrentProfileIndex(0);
      alert("No more profile")
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Current profile to display
  const currentProfile = profiles[currentProfileIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading pet profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
     <div className="flex items-center justify-center h-screen bg-gray-100">
  <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
    <p className="text-red-500 text-xl font-bold mb-4">Access Denied</p>
    <p className="text-gray-700 mb-2">
      To see dating profiles, please fill out your pet's profile form first.
    </p>
    <a
      href="https://www.pawin.co.in/home/dating-form"
      className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
    >
      Go to Form
    </a>
  </div>
</div>

    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <p className="text-gray-700 text-xl mb-4">No pet profiles available</p>
          <p className="text-gray-500">Check back soon for new furry friends!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* App Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">PetMatch</h1>
          <p className="text-gray-500">Find the perfect playdate for your pet!</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Images */}
          <div className="relative h-80">
            {currentProfile?.mediaFiles && currentProfile.mediaFiles.length > 0 ? (
              <img 
                src={currentProfile.mediaFiles[0].url} 
                alt={`${currentProfile.petName} photo`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <PawPrint size={60} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{currentProfile?.petName || 'Unknown'}</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {currentProfile?.breed || 'Unknown Breed'}
              </span>
            </div>

            <div className="mt-2 flex items-center text-gray-600">
              <User size={16} className="mr-1" />
              <span className="mr-3">{currentProfile?.gender || 'Unknown'}</span>
              <Calendar size={16} className="mr-1" />
              <span>{currentProfile?.age ? `${currentProfile.age} years` : 'Unknown age'}</span>
            </div>

            <div className="mt-2 flex items-center text-gray-600">
              <MapPin size={16} className="mr-1" />
              <span>{currentProfile?.location || 'Unknown location'}</span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-700">Personality</h3>
              <p className="text-gray-600">{currentProfile?.personality || 'No information provided'}</p>
            </div>


            <div className="mt-3 text-xs text-gray-500">
              Profile created: {currentProfile?.createdAt ? formatDate(currentProfile.createdAt) : 'Unknown date'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-6 p-4 border-t border-gray-100">
            <button 
              onClick={handleDislike}
              className="bg-red-100 hover:bg-red-200 text-red-600 p-4 rounded-full transition"
            >
              <X size={24} />
            </button>
            <button 
              onClick={handleLike}
              className="bg-green-100 hover:bg-green-200 text-green-600 p-4 rounded-full transition"
            >
              <Heart size={24} />
            </button>
            <button 
              className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-4 rounded-full transition"
            >
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        {/* Profile Navigation Indicator */}
        <div className="flex justify-center mt-4 space-x-1">
          {profiles.map((_, index) => (
            <div 
              key={index} 
              className={`h-1 rounded-full ${index === currentProfileIndex ? 'bg-blue-500 w-6' : 'bg-gray-300 w-2'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}