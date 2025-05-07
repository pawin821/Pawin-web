// pages/pets/[id].js
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getAdaptionData, getPetData, getLostReportData } from '../../../../firebase/firebase.jsx';
import { 
  CheckCircle, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  ShoppingCart, 
  Heart,
  MessageCircle,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import React from 'react';


export default function PetDetail({ params }) {
  // Use React.use to unwrap params (for future Next.js compatibility)
  const unwrappedParams = React.use ? React.use(params) : params;
  const id = unwrappedParams?.id;

  const router = useRouter();
  const [pet, setPet] = useState(null);
  const [adData, setAdData] = useState(false); // adoption data
  const [lostData, setLostData] = useState(false); // lost pet data
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Define currentMediaIsVideo after state initialization
  const currentMediaIsVideo = pet?.media && pet.media[activeMedia]?.resource_type === 'video';

  useEffect(() => {
    if (id) {
      fetchPetData();
    }
  }, [id]);

  // Reset video playing state when changing media and set up fullscreen
  useEffect(() => {
    setIsVideoPlaying(false);
    
    // Set up fullscreen handling for videos
    const setupFullscreenButton = () => {
      if (!pet?.media) return;
      
      const isVideoMedia = pet.media[activeMedia]?.type === 'video';
      const videoContainer = document.getElementById('video-container');
      const videoElement = document.getElementById('main-pet-video');
      
      if (videoContainer && videoElement && isVideoMedia) {
        const toggleFullScreen = () => {
          if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
          } else {
            document.exitFullscreen();
          }
        };
        
        // Add double-click event for fullscreen toggle
        videoContainer.addEventListener('dblclick', toggleFullScreen);
        
        return () => {
          videoContainer.removeEventListener('dblclick', toggleFullScreen);
        };
      }
    };
    
    setupFullscreenButton();
  }, [activeMedia, pet?.media]);

  const fetchPetData = async () => {
    try {
      setLoading(true);
      
      // Try to get regular pet listing data first
      let petData = await getPetData(id);
      
      // If no pet listing found, try adoption data
      if (!petData) {
        petData = await getAdaptionData(id);
        if (petData) {
          setAdData(true);
        }
      }
      
      // If still no data, try lost pet report data
      if (!petData) {
        petData = await getLostReportData(id);
        if (petData) {
          setLostData(true);
        }
      }
      
      // If no data found in any collection, redirect to home
      if (!petData) {
        router.push('/home');
        return;
      }
      
      // Process media data
      if (petData.media || petData.mediaFiles) {
        // Normalize between media and mediaFiles properties
        const mediaArray = petData.media || 
                          (petData.mediaFiles ? 
                            petData.mediaFiles.map(file => ({ url: file })) : 
                            []);
        
        petData.media = mediaArray.map(item => {
          // Check if media type is already defined
          if (!item.type) {
            // Detect if it's a video based on extension
            const isVideo = item.url?.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/);
            return {
              ...item,
              type: isVideo ? 'video' : 'image',
              // Add a default thumbnail for videos if not provided
              thumbnail: isVideo && !item.thumbnail ? 
                '/images/video-thumbnail-placeholder.jpg' : item.thumbnail
            };
          }
          return item;
        });
      }
      
      // Add a fallback image if no media is available
      if (!petData.media || petData.media.length === 0) {
        petData.media = [{
          url: '/images/pet-placeholder.jpg',
          type: 'image'
        }];
      }
      
      setPet(petData);
    } catch (error) {
      console.error('Error fetching pet detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoToggle = () => {
    const videoElement = document.getElementById('main-pet-video');
    if (videoElement) {
      if (isVideoPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(err => {
          console.error("Error playing video:", err);
          // Show friendly error message to user if needed
        });
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };
  
  // Handle video events
  useEffect(() => {
    const videoElement = document.getElementById('main-pet-video');
    if (videoElement) {
      const handleVideoEnded = () => setIsVideoPlaying(false);
      const handleVideoPlay = () => setIsVideoPlaying(true);
      const handleVideoPause = () => setIsVideoPlaying(false);
      
      videoElement.addEventListener('ended', handleVideoEnded);
      videoElement.addEventListener('play', handleVideoPlay);
      videoElement.addEventListener('pause', handleVideoPause);
      
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnded);
        videoElement.removeEventListener('play', handleVideoPlay);
        videoElement.removeEventListener('pause', handleVideoPause);
      };
    }
  }, [activeMedia]);

  // Initialize Razorpay payment - only for regular pet listings
  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // Normally you would fetch an order ID from your backend here
      const options = {
        key: "rzp_test_YOUR_KEY_ID", // Replace with your actual Razorpay test key
        amount: pet.cost * 100, // Amount in smallest currency unit (paise for INR)
        currency: "INR",
        name: "Pet Marketplace",
        description: `Payment for ${pet.breed}`,
        image: pet.media?.[0]?.url || "",
        order_id: "", // This should come from your backend
        handler: function (response) {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          // Here you would update your database to mark the pet as sold
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        notes: {
          petId: pet.id
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed to initialize. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Get contact action button text based on data type
  const getContactButtonText = () => {
    if (lostData) return "Contact Owner";
    if (adData) return "Contact Adoption Center";
    return "Contact Seller";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-xl">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return null;
  }

  // Determine the primary title text based on data type
  const getTitleText = () => {
    if (lostData) {
      return `${pet.breed || 'Lost Pet'}`;
    }
    return pet.breed || 'Pet';
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Razorpay Script - only needed for regular pet listings */}
      {!lostData && !adData && (
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      )}
      
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/home" className="mr-4 transition hover:scale-110">
                <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
              </Link>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {getTitleText()}
                </h1>
                {lostData && (
                  <span className="inline-flex ml-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Lost Pet
                  </span>
                )}
                {pet.hasBadge && (
                  <span className="inline-flex items-center ml-2 text-green-600" title="Verified Seller">
                    <CheckCircle className="h-5 w-5" />
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Image/Video Gallery */}
            <div className="md:w-3/5 bg-gray-900">
              <div className="relative h-80 md:h-[500px] flex items-center justify-center bg-black">
                {pet.media && pet.media.length > 0 ? (
                  <>
                    {currentMediaIsVideo ? (
                      <div id="video-container" className="relative w-full h-full flex items-center justify-center">
                        <video
                          id="main-pet-video"
                          src={pet.media[activeMedia].url}
                          className="max-h-full max-w-full object-contain"
                          onClick={handleVideoToggle}
                          playsInline
                          controls={isVideoPlaying}
                          controlsList="nodownload"
                          loop
                        />
                        {!isVideoPlaying && (
                          <button 
                            onClick={handleVideoToggle}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity"
                          >
                            <div className="bg-white bg-opacity-20 p-6 rounded-full">
                              <Play className="h-20 w-20 text-black opacity-90" />
                            </div>
                          </button>
                        )}
                        <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                          Double-click for fullscreen
                        </div>
                      </div>
                    ) : (
                      <img
                        src={pet.media[activeMedia].url}
                        alt={`${pet.breed || 'Pet'}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-500 font-medium">No images or videos available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {pet.media && pet.media.length > 1 && (
                <div className="flex p-4 bg-gray-800 overflow-x-auto gap-2">
                  {pet.media.map((media, index) => (
                    <div 
                      key={index}
                      className={`relative h-20 w-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition transform hover:scale-105 ${
                        activeMedia === index ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-70'
                      }`}
                      onClick={() => setActiveMedia(index)}
                    >
                      {media.type === 'video' ? (
                        <div className="relative h-full w-full">
                          <img
                            src={media.thumbnail || media.url}
                            alt={`Video thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pet Details */}
            <div className="md:w-2/5 p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{pet.breed || 'Pet'}</h2>
                <div className="mt-2 flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                  <span className="text-lg">
                    {lostData ? 
                      (pet.lostAddress || pet.foundAddress || 'Location not specified') : 
                      (pet.location || 'Location not specified')}
                  </span>
                </div>
              </div>

              {/* Different information cards based on data type */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="text-sm mb-1 text-indigo-700">Gender</div>
                  <div className="font-semibold text-lg">{pet.gender || 'Not specified'}</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="text-sm mb-1 text-indigo-700">Age</div>
                  <div className="font-semibold text-lg">{pet.age || 'Not specified'}</div>
                </div>
                
                {/* Only show price for regular pet listings */}
                {!lostData && !adData && (
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <div className="text-sm mb-1 text-indigo-700">Price</div>
                    <div className="font-bold text-xl text-indigo-700">${pet.cost || 'N/A'}</div>
                  </div>
                )}
                
                {/* Show specialized cards for lost pets */}
                {lostData && (
                  <div className="bg-yellow-50 p-4 rounded-xl col-span-2">
                    <div className="text-sm mb-1 text-yellow-700">Status</div>
                    <div className="font-bold text-xl text-yellow-700">Lost Pet</div>
                  </div>
                )}
                
                {/* Date information */}
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="text-sm mb-1 text-indigo-700">
                    {lostData ? 'Reported' : 'Listed'}
                  </div>
                  <div className="font-semibold text-lg">
                    {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
                
                {/* Color information */}
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="text-sm mb-1 text-indigo-700">Color</div>
                  <div className="font-bold text-lg text-indigo-700">{pet.color || 'Not specified'}</div>
                </div>
                
                {/* Vaccination status - not typically relevant for lost pets */}
                {!lostData && (
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    <div className="text-sm mb-1 text-indigo-700">Vaccinated</div>
                    <div className="font-semibold text-lg">
                      {pet.vaccine || 'Not specified'}
                    </div>
                  </div>
                )}
                
                {/* Lost location - only for lost pets */}
                {lostData && pet.lostAddress && (
                  <div className="bg-indigo-50 p-4 rounded-xl col-span-2">
                    <div className="text-sm mb-1 text-indigo-700">Last Seen</div>
                    <div className="font-semibold text-lg">{pet.lostAddress}</div>
                  </div>
                )}
                
                {/* Found location - only for lost pets that have been found */}
                {lostData && pet.foundAddress && (
                  <div className="bg-green-50 p-4 rounded-xl col-span-2">
                    <div className="text-sm mb-1 text-green-700">Found At</div>
                    <div className="font-semibold text-lg">{pet.foundAddress}</div>
                  </div>
                )}
              </div>

  

              {/* Contact/Action Section */}
                   
    <div className="font-bold text-xl text-indigo-700 p-3">
      If found, contact us
    </div>

              <div className="space-y-4">
                {/* Only show Buy button for regular pet listings */}
              
                {/* Show "Report Found" button for lost pets */}
           
                           <a
               href="https://wa.me/916281737208"
               target="_blank"
               rel="noopener noreferrer"
             >
               <button className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                 <MessageCircle className="h-5 w-5 mr-2" />
                 Contact              </button>
             </a>
             
              </div>

              {/* User/Owner/Seller Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900">
                      {lostData ? 'Owner' : (adData ? 'Posted by' : 'Seller')}
                      {pet.userId && `: ${pet.userId.substring(0, 8)}...`}
                      {pet.hasBadge && (
                        <span className="inline-flex items-center ml-1 text-green-600" title="Verified User">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lostData ? 'Contact to help reunite' : (adData ? 'Adoption center representative' : 'Joined recently')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}