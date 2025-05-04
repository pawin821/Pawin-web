"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2 } from 'lucide-react';
import { checkUserBadge, savePetData } from '../../../firebase/firebase';
import { useAuth } from "@clerk/nextjs";

export default function PetRegistrationForm() {
  const { userId, isSignedIn } = useAuth();

  const [formData, setFormData] = useState({
    breed: '',
    gender: '',
    age: '',
    location: '',
    latitude: '',
    longitude: '',
    cost: '',
    color: '',
    vaccine: '',
    userId: '',
    mediaFiles: []
  });
  
  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  
  // Auto-fill coordinates on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
      }, (error) => {
        console.error("Error getting location:", error);
      });
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        setFormData(prev => ({ ...prev, userId: userId }));
      
        // Check user badge status from Firestore
        try {
          const hasBadge = await checkUserBadge(userId);
          setUserHasBadge(hasBadge);
        } catch (error) {
          console.error("Error checking user badge:", error);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaUploadSuccess = (result) => {
    console.log('Upload success:', result);
    setIsUploading(false);
    
    if (result.info) {
      // Create media object with all necessary info
      const newMedia = {
        url: result.info.secure_url,
        public_id: result.info.public_id,
        resource_type: result.info.resource_type,
        name: result.info.original_filename || 'Uploaded file'
      };
      
      // Add the uploaded media to our state
      setFormData(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, newMedia]
      }));
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      // Prepare pet data object for Firebase
      const petData = {
        breed: formData.breed,
        gender: formData.gender,
        age: formData.age,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        cost: formData.cost,
        userId: userId,
        vaccine: formData.vaccine,
        color: formData.color,
        media: formData.mediaFiles.map(media => ({
          url: media.url,
          public_id: media.public_id,
          resource_type: media.resource_type,
          name: media.name
        })),
        hasBadge: userHasBadge,
        createdAt: new Date()
      };
      
      // Save pet data to Firebase using imported function
      await savePetData(petData);
      
      console.log("Pet registration submitted successfully:", petData);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setFormData({
        breed: '',
        gender: '',
        age: '',
        location: '',
        latitude: '',
        longitude: '',
        cost: '',
        color: '',
        vaccine: '',
        userId: userId,
        mediaFiles: []
      });
      
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#FDE5C0] py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Pet Registration Form</h1>
        </div>
        
        <div className="p-8">
          {userHasBadge && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-700 font-medium">Verified Badge User</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User ID (Hidden or Disabled) */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                User ID
              </label>
              <input
                type="text"
                name="userId"
                value={userId || ''}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Badge Status */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Badge Status
              </label>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${userHasBadge ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {userHasBadge ? 'Badge Verified' : 'No Badge'}
                </span>
              </div>
            </div>

            {/* Media Upload with Cloudinary */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Upload Photos/Videos
              </label>
              <div className="mt-1">
                <CldUploadWidget
                  uploadPreset="pawin_123456"
                  onSuccess={handleMediaUploadSuccess}
                  onStart={() => setIsUploading(true)}
                >
                  {({ open }) => (
                    <button
                      onClick={() => open()}
                      className="w-full h-40 flex flex-col items-center justify-center space-y-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                      disabled={isUploading}
                      type="button"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin">
                            <Loader2 className="w-12 h-12" />
                          </div>
                          <span className="font-semibold">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12" />
                          <span className="font-semibold">Click to Upload Images/Videos</span>
                          <span className="text-xs opacity-75">You can upload multiple files</span>
                        </>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
              
              {/* Media Gallery Preview */}
              {formData.mediaFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Media</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.mediaFiles.map((media, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden shadow-md bg-white">
                        <div className="relative aspect-square">
                          <Image 
                            src={media.url} 
                            alt={media.name || `Uploaded media ${index + 1}`}
                            fill
                            objectFit="cover"
                            className="rounded-t-lg"
                          />
                          {media.resource_type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                              <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" fillRule="evenodd"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-2 flex justify-between items-center">
                          <span className="text-xs text-gray-500 truncate">{media.name || `File ${index + 1}`}</span>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Breed Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Breed Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter pet breed"
              />
            </div>
             {/* Color */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter pet color"
              />
            </div>
             {/* Vaccine */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Vaccine <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vaccine"
                value={formData.vaccine}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter pet vaccine information"
              />
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter pet age"
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter pet location"
              />
            </div>

            {/* Coordinates (hidden fields) */}
            <input
              type="hidden"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
            />
            <input
              type="hidden"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
            />

            {/* Cost */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <span className="font-bold">Cost</span> <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter pet cost"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className={`px-6 py-3 bg-[#B6DAD9] text-white font-medium rounded-md shadow-md hover:bg-[#9BC0BF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition hover:scale-105 ${
                  submitStatus === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {submitStatus === 'submitting' ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
            
            {/* Success/Error message */}
            {submitStatus === 'success' && (
              <div className="mt-4 bg-green-100 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-700">Registration submitted successfully!</p>
                </div>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700">There was an error submitting your registration. Please try again.</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}