"use client"
import { useState } from 'react';
import { Heart, Search, MapPin, Video, PawPrint, Calendar, DollarSign, 
         MessageCircle, Star, Users, Briefcase, User, AlertTriangle } from 'lucide-react';
import { Stethoscope } from "lucide-react";
import { getToken } from "firebase/messaging";
import { messaging } from '@/firebase/firebase';

// Adding custom font styles and colors as per requirements
const styles = {
  fonts: {
    primary: "'Poppins', 'Nunito', 'Inter', sans-serif",
  },
  colors: {
    tealBlue: "#2D7D7A",
    softPeach: "#FDE5C0",
    mutedYellow: "#FAD688",
    softOrange: "#F5A953",
    mintGreen: "#B6DAD9",
    whiteIvory: "#F9F9F3",
    darkText: "#333333",
  }
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('home');
    async function requestPermission() {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Generate Token
        const token = await getToken(messaging, {
          vapidKey:
            "BGX1F5woV-7Quwi7c2vcxIDuOUsal88_UW4ygOOfHDwVMdqRAH-uCDrEBzUts1U0AN5oVJxxodtmmOSlJ4EOjvc",
        });
        console.log("Token Gen", token);
        // Send this token  to server ( db)
      } else if (permission === "denied") {
        alert("You denied for the notification");
      }
    }
  
    useEffect(() => {
      // Req user for notification permission
      requestPermission();
    }, []);
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: styles.colors.whiteIvory, fontFamily: styles.fonts.primary }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
              <img src="/logo.png" alt="PetPals Logo" className="h-14 w-auto" />
           
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
         
              
         
              </div>
            </div>
        <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
  {/* Android Icon */}
  <a
    href="https://play.google.com/store/apps/details?id=com.yourapp.android"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://w7.pngwing.com/pngs/462/120/png-transparent-iphone-google-play-android-get-started-now-button-electronics-text-logo.png"
      alt="Download on Android"
      className="h-10 w-auto hover:scale-105 transition-transform"
    />
  </a>

  {/* iOS Icon */}
  <a
    href="https://apps.apple.com/us/app/yourapp/idXXXXXXXXX"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQT5wbyQA1MXQWe_E1TtPb5zBklQjH_N_xVnQ&s"
      alt="Download on iOS"
      className="h-10 w-auto hover:scale-105 transition-transform"
    />
  </a>
</div>

          </div>
        </div>
      </nav>
      

      {/* Hero Section */}
      <div style={{ backgroundColor: styles.colors.softPeach }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: styles.colors.tealBlue }}>
                Your Pet's Perfect <span style={{ color: styles.colors.softOrange }}>Companion</span>
              </h1>
              <p className="mt-3 max-w-md text-lg" style={{ color: styles.colors.darkText }}>
                Pawfin connects pet lovers through buying, selling, adoption, social sharing, and more. Everything your pet needs in one place.
              </p>
              <div className="mt-8 flex">
                <div className="inline-flex rounded-md shadow">
                  <a
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white" 
                    style={{ backgroundColor: styles.colors.tealBlue }}
                  >
                    Create Account
                  </a>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <a
                    href="/sign-in"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 hover:bg-indigo-900"
                  >
                    Login
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 md:mt-0 md:w-1/2">
              <div className="relative rounded-lg ">
                <img 
                  src="/hero.png" 
                  alt="dog and cat" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Modules Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold" style={{ color: styles.colors.darkText }}>
              Everything for your <span style={{ color: styles.colors.tealBlue }}>furry friend</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Discover all our pet-friendly features designed to make pet ownership delightful.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Module 1: Buy & Sell */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.mutedYellow }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Buy & Sell Pets</h3>
                  <p className="mt-2 text-gray-600">
                    Browse listings with detailed information including breed, age, gender, location and price.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Breed</span>
                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">Gender</span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Age</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Location</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Explore marketplace
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Module 2: Adoption */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.mintGreen }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Heart className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Pet Adoption</h3>
                  <p className="mt-2 text-gray-600">
                    Find pets in need of loving homes near you. Filter by location and pet details.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Nearby</span>
                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">Breed</span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Age</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Find adoptable pets
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Module 3: Reels */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.whiteIvory }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Video className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Pet Reels</h3>
                  <p className="mt-2 text-gray-600">
                    Share and watch adorable videos of pets. Similar to Instagram reels but just for pets!
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Trending</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Funny</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Cute</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Watch pet reels
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Module 4: Lost & Found */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.whiteIvory }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.softOrange }}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Lost & Found</h3>
                  <p className="mt-2 text-gray-600">
                    Report lost pets or help reunite found pets with their owners. Includes details and last seen location.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Lost</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Found</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Location</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Report lost/found pet
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Module 5: Pet Dating */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.softPeach }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Heart className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Pet Dating</h3>
                  <p className="mt-2 text-gray-600">
                    Find the perfect match for your pet with our Tinder-style swiping system. Filter by breed and location.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Nearby</span>
                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">Same Breed</span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Gender</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Find a match
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Module 6: Vet Listing */}
              <div className="bg-gradient-to-br p-6 rounded-xl shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: styles.colors.softOrange, opacity: 0.8 }}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Vet Services</h3>
                  <p className="mt-2 text-gray-600">
                    Find and connect with veterinarians near you. View ratings, services, and book appointments.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Emergency</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Specialized</span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Rating</span>
                  </div>
                  <a href="#" className="mt-4 inline-flex items-center" style={{ color: styles.colors.tealBlue }}>
                    Find vets
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="py-12" style={{ backgroundColor: "#f0f7f7" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold" style={{ color: styles.colors.darkText }}>
              <span style={{ color: styles.colors.tealBlue }}>Tailored</span> for everyone
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Different accounts for different needs - all connected in one pet-loving community.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Pet Owner */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <User className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Pet Owners</h3>
                  <p className="mt-2 text-gray-600">
                    Manage your pet profiles, browse adoptions, find matches, and connect with other pet lovers.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Create pet profiles</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Find pet matches</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Share pet moments</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Breeder */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Users className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Breeders</h3>
                  <p className="mt-2 text-gray-600">
                    Special tools for breeders to manage and showcase their animals with detailed breeding information.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Dedicated breeder dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Track lineage and breeding</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Verified seller status</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Vet */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-12 h-12 rounded-md text-white" style={{ backgroundColor: styles.colors.tealBlue }}>
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium" style={{ color: styles.colors.darkText }}>Veterinary Doctor Booking</h3>
                  <p className="mt-2 text-gray-600">
                    Tools to help users book veterinary doctors, manage appointments, and ensure timely care for their animals.
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Find local vets</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Easy appointment scheduling</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Pet health records</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Optional */}
      <footer className="bg-white" style={{ borderTop: `4px solid ${styles.colors.tealBlue}` }}>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <span className="text-2xl font-bold" style={{ color: styles.colors.tealBlue }}>Paw<span style={{ color: "#f472b6" }}>in</span></span>
              <PawPrint className="ml-1 h-6 w-6 text-pink-500" />
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center md:text-right text-sm text-gray-500">
                &copy; 2025 Pawin. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}