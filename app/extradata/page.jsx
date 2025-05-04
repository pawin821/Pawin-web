"use client"

import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Check, User, MapPin } from 'lucide-react';
import { saveUserData } from '../../firebase/firebase';
import { CldUploadWidget } from 'next-cloudinary';
import { useAuth } from "@clerk/nextjs";


export default function PetRegistrationForm() {

  const { userId, sessionId, getToken, isLoaded, isSignedIn } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    petType: '',
    breed: '',
    userType: '',
    badge:'',
    vet:'',
    documents: [],
    profilePhoto: '', // Added field for profile photo
    latitude: null,   // Added field for latitude
    longitude: null   // Added field for longitude
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [isProfileUploaded, setIsProfileUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [geoLocationError, setGeoLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuccess = async (result) => {
    console.log('Upload success:', result);
    setIsUploading(false);
    setIsUploaded(true);
  
    
    if (result.info && result.info.secure_url) {
      console.log(result.info.secure_url); // URL of document
      
      // Add the uploaded document to our state
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, {
          name: result.info.original_filename || 'Uploaded file',
          url: result.info.secure_url
        }]
      }));
    }
  };

  const handleProfileSuccess = async (result) => {
    console.log('Profile upload success:', result);
    setIsProfileUploading(false);
    setIsProfileUploaded(true);
    
    if (result.info && result.info.secure_url) {
      console.log(result.info.secure_url); // URL of profile photo
      
      // Add the profile photo URL to our state
      setFormData(prev => ({
        ...prev,
        profilePhoto: result.info.secure_url
      }));
    }
  };

  const removeDocument = (index) => {
    // Remove from UI document list
    setFormData(prev => ({
      ...prev, 
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const removeProfilePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: ''
    }));
    setIsProfileUploaded(false);
  };
  
  // Function to get user's geolocation
  const getUserLocation = () => {
    setIsGettingLocation(true);
    setGeoLocationError(null);
    
    if (!navigator.geolocation) {
      setGeoLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success callback
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        // Error callback
        console.error("Error getting location:", error);
        let errorMessage = "Unable to retrieve your location";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get location timed out.";
            break;
        }
        
        setGeoLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Get geolocation before submitting
      if (!formData.latitude || !formData.longitude) {
        // Get user location first if we don't have it yet
        setIsSubmitting(false);
        getUserLocation();
        // Show a toast or alert that we're getting location
        
        // We'll use the useEffect below to handle submission once location is obtained
        return;
      }
      
      // Save user data directly to Firebase - document URLs are already in formData
      await saveUserData(userId, formData);
      
      // Set success and reset submission state
      setSubmitSuccess(true);
      setIsSubmitting(false);

    } catch (error) {
      console.error("Error during submission:", error);
      setSubmitError("There was an error submitting your form. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  // Effect to automatically submit form after getting location
  useEffect(() => {
    // Only proceed if we were in the middle of submitting and now have location data
    if (!isSubmitting && formData.latitude && formData.longitude && isGettingLocation === false) {
      const submitFormWithLocation = async () => {
        setIsSubmitting(true);
        
        try {
          await saveUserData(userId, formData);
          setSubmitSuccess(true);
          setIsSubmitting(false);
        } catch (error) {
          console.error("Error during submission with location:", error);
          setSubmitError("There was an error submitting your form. Please try again.");
          setIsSubmitting(false);
        }
      };
      
      // Only auto-submit if we were explicitly getting location
      if (geoLocationError === null) {
        submitFormWithLocation();
      }
    }
  }, [formData.latitude, formData.longitude, isGettingLocation]);

  const needsDocuments = formData.userType === 'breeder' || formData.userType === 'vet';
  const isVet = formData.userType === 'vet';
  const showBreedField = formData.petType === 'dog' || formData.petType === 'cat';

  // Check if form is complete based on user type
  const isFormComplete = () => {
    const baseRequirements = formData.name && formData.phone && formData.location && 
                            formData.petType && (!showBreedField || formData.breed) && 
                            formData.userType;
    
    if (needsDocuments && formData.documents.length === 0) {
      return false;
    }
    
    if (isVet && !formData.profilePhoto) {
      return false;
    }
    
    return baseRequirements;
  };

  // Breed options based on pet type
  const breedOptions = {
    dog: [
      'Labrador Retriever', 
      'German Shepherd', 
      'Golden Retriever', 
      'French Bulldog', 
      'Bulldog', 
      'Poodle', 
      'Beagle', 
      'Rottweiler', 
      'Dachshund', 
      'Siberian Husky',
      'Shih Tzu',
      'Mixed Breed',
      'Other'
    ],
    cat: [
      'Domestic Shorthair', 
      'Maine Coon', 
      'Persian', 
      'Siamese', 
      'Ragdoll', 
      'British Shorthair', 
      'Sphynx', 
      'Bengal', 
      'Abyssinian', 
      'Scottish Fold',
      'American Shorthair',
      'Mixed Breed',
      'Other'
    ]
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md md:max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Pet Owner Registration</h1>
            <p className="text-gray-600 mt-2">Tell us about yourself and your pets</p>
          </div>
          
          {submitSuccess ? (
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Complete!</h2>
              <p className="text-gray-600 mb-2">
                Thank you for registering with us. We'll be in touch soon.
              </p>
              <p className="text-gray-600 mb-6">
                We will verify your account and give you a badge.
              </p>
              <a
                href="https://www.pawin.co.in/home"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Go to Home Page
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter your location"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use your location to connect you with local services.
                    {formData.latitude && formData.longitude ? (
                      <span className="block mt-1 text-green-600">✓ Location coordinates captured</span>
                    ) : (
                      <span className="block mt-1">Location coordinates will be captured when you register.</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Pet Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Pet Information</h2>
                
                <div>
                  <label htmlFor="petType" className="block text-sm font-medium text-gray-700">Pet Type</label>
                  <select
                    id="petType"
                    name="petType"
                    value={formData.petType}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Select a pet type</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Breed field - only shown for dogs and cats */}
                {showBreedField && (
                  <div>
                    <label htmlFor="breed" className="block text-sm font-medium text-gray-700">Breed</label>
                    <select
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="" disabled>Select a breed</option>
                      {formData.petType && breedOptions[formData.petType].map(breed => (
                        <option key={breed} value={breed}>{breed}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="userType" className="block text-sm font-medium text-gray-700">Are you a:</label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Select your category</option>
                    <option value="petOwner">Pet Owner</option>
                    <option value="breeder">Breeder</option>
                    <option value="vet">Veterinarian</option>
                  </select>
                </div>
              </div>
              
              {/* Profile Photo Upload for Veterinarians */}
              {isVet && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Veterinarian Profile Photo</h2>
                  <p className="text-sm text-gray-600">
                    Please upload a professional headshot for your veterinarian profile.
                    This will be displayed on your public profile to establish trust with pet owners.
                  </p>
                  
                  {/* Cloudinary Widget Upload for Profile */}
                  <div className="mt-4">
                    <CldUploadWidget 
                      uploadPreset="pawin_123456" 
                      onSuccess={handleProfileSuccess}
                      onStart={() => setIsProfileUploading(true)}
                      options={{
                        sources: ['local', 'camera'],
                        resourceType: 'image',
                        cropping: true,
                        croppingAspectRatio: 1,
                        maxFileSize: 2000000,
                        clientAllowedFormats: ['jpg', 'jpeg', 'png']
                      }}
                    >
                      {({ open }) => (
                        <button
                          onClick={() => open()}
                          className="w-full h-32 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                          disabled={isProfileUploading}
                        >
                          {formData.profilePhoto ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={formData.profilePhoto} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-xl"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-xl">
                                <span className="font-semibold">Change Photo</span>
                              </div>
                            </div>
                          ) : isProfileUploading ? (
                            <>
                              <div className="animate-spin">
                                <Loader2 className="w-12 h-12" />
                              </div>
                              <span className="font-semibold">Uploading Profile...</span>
                            </>
                          ) : (
                            <>
                              <User className="w-12 h-12" />
                              <span className="font-semibold">Upload Profile Photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                  
                  {isProfileUploading && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading profile photo...</span>
                    </div>
                  )}
                  
                  {/* Display profile photo if uploaded */}
                  {formData.profilePhoto && (
                    <div className="flex justify-between items-center py-2 px-4 text-sm border rounded-md">
                      <span className="truncate max-w-xs">Profile Photo</span>
                      <button
                        type="button"
                        onClick={removeProfilePhoto}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Document Upload for Breeders/Vets */}
              {needsDocuments && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Document Upload</h2>
                  <p className="text-sm text-gray-600">
                    {formData.userType === 'breeder' 
                      ? 'Please upload your breeding license or certification documents.' 
                      : 'Please upload your veterinary practice credentials and license.'}
                  </p>
                  
                  {/* Cloudinary Widget Upload for Documents */}
                  <div className="mt-4">
                    <CldUploadWidget 
                      uploadPreset="pawin_123456" 
                      onSuccess={handleSuccess}
                      onStart={() => setIsUploading(true)}
                    >
                      {({ open }) => (
                        <button
                          onClick={() => open()}
                          className="w-full h-32 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                          disabled={isUploading}
                        >
                          {isUploaded ? (
                            <>
                              <Check className="w-12 h-12" />
                              <span className="font-semibold">Upload Successful!</span>
                            </>
                          ) : isUploading ? (
                            <>
                              <div className="animate-spin">
                                <Loader2 className="w-12 h-12" />
                              </div>
                              <span className="font-semibold">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-12 h-12" />
                              <span className="font-semibold">Click to Upload Document</span>
                            </>
                          )}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                  
                  {isUploading && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  
                  {/* List of uploaded documents */}
                  {formData.documents.length > 0 && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-gray-700">Uploaded Documents:</h3>
                      <ul className="mt-1 border rounded-md divide-y">
                        {formData.documents.map((doc, index) => (
                          <li key={index} className="flex justify-between items-center py-2 px-4 text-sm">
                            <span className="truncate max-w-xs">{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* Location status indicator */}
              {geoLocationError && (
                <div className="p-4 mt-4 rounded-md bg-yellow-50">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">{geoLocationError}</h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Your approximate location is needed to connect you with local services.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-4 sticky bottom-0 bg-white pb-2 mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormComplete()}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting || !isFormComplete()
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Submitting...
                    </>
                  ) : isGettingLocation ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Getting Location...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
              
              {submitError && (
                <div className="p-4 mt-4 rounded-md bg-red-50">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{submitError}</h3>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}