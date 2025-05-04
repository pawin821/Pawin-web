"use client";
import React, { useEffect, useState } from "react";
import { getAllVets } from "../../../firebase/firebase";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";

const VetBookingPage = () => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Function to get random animal image URL
  const getRandomPetImage = () => {
    // Randomly choose between cat and dog
    const animalType = Math.random() > 0.5 ? 'cat' : 'dog';
    // Random size parameter for variety
    const size = Math.floor(Math.random() * 200) + 300;
    return `https://source.unsplash.com/random/${size}x${size}/?${animalType},pet`;
  };

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const vetList = await getAllVets();
        setVets(vetList);
      } catch (error) {
        console.error("Failed to fetch vets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVets();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Find Your Pet's Perfect Vet</h1>
        <p className="text-gray-600 mt-2">Browse our network of qualified veterinarians and book an appointment</p>
      </header>
      
      {vets.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-xl">
          <p className="text-lg text-gray-700">No veterinarians are currently available.</p>
          <p className="text-sm text-gray-500 mt-2">Please check back later or contact support.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
             {vets.map((vet) => (
          <div 
            key={vet.id}
            className="border border-gray-200 rounded-xl shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative h-80 bg-blue-50">
              <img
                src={vet.profilePhoto}
                alt={`Dr. ${vet.name} with pet`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/80 to-transparent p-6">
                <h2 className="text-white font-bold text-3xl">Dr. {vet.name || "Unnamed"}</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700 text-lg">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                  <span>{vet.location || "Location not specified"}</span>
                </div>
                
                {vet.specialties && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {vet.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center text-gray-700 text-lg">
                  <Clock className="h-5 w-5 mr-3 text-blue-600" />
                  <span>Available for appointments</span>
                </div>
              </div>
              
           <a
  href={`https://wa.me/916281737208?text=Hi, I would like to book an appointment with Dr. ${vet.name}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <button
    className="w-full py-5 px-8 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white text-xl font-bold rounded-xl flex items-center justify-center gap-4 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
  >
    <Calendar className="h-7 w-7" />
    Book Appointment
  </button>
</a>

            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default VetBookingPage;