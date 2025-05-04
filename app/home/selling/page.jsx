"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, MapPin, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(1);
  
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
      
      // Reset to first step
      setActiveStep(1);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus('error');
    }
  };

  const nextStep = () => {
    setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="mt-4 text-purple-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress steps */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${activeStep >= step 
                      ? 'bg-purple-600 text-white border-purple-600' 
                      : 'bg-white text-gray-400 border-gray-300'} 
                    transition-all duration-300`}
                >
                  {step}
                </div>
                <span className={`mt-2 text-xs sm:text-sm font-medium ${activeStep >= step ? 'text-purple-600' : 'text-gray-500'}`}>
                  {step === 1 ? 'Pet Photos' : step === 2 ? 'Basic Info' : 'Details'}
                </span>
              </div>
            ))}
            {/* Progress line between steps */}
            <div className="absolute left-0 right-0 flex justify-center">
              <div className="w-2/3 bg-gray-200 h-0.5 absolute top-5 -z-10">
                <div 
                  className="bg-purple-600 h-full transition-all duration-300" 
                  style={{ width: `${(activeStep - 1) * 50}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 py-6 px-8">
            <h1 className="text-3xl font-bold text-white text-center">Pet Registration</h1>
            {userHasBadge && (
              <div className="mt-2 flex justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400 text-purple-900">
                  <CheckCircle className="h-4 w-4 mr-1" /> Verified Badge User
                </span>
              </div>
            )}
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeStep === 1 && (
                <div className="space-y-6 transition-opacity duration-300">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">Upload Pet Photos</h2>
                    <p className="text-gray-600 mt-2">Start by adding some great photos of your pet</p>
                  </div>

                  {/* Media Upload with Cloudinary */}
                  <div>
                    <CldUploadWidget
                      uploadPreset="pawin_123456"
                      onSuccess={handleMediaUploadSuccess}
                      onStart={() => setIsUploading(true)}
                    >
                      {({ open }) => (
                        <button
                          onClick={() => open()}
                          className="w-full h-48 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 ease-in-out"
                          disabled={isUploading}
                          type="button"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                              <span className="font-semibold text-purple-700">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-12 h-12 text-purple-500" />
                              <div className="text-center">
                                <span className="font-semibold text-purple-700 block">Click to Upload Images/Videos</span>
                                <span className="text-xs text-purple-600 opacity-75 block">JPG, PNG, or MP4 files accepted</span>
                              </div>
                            </>
                          )}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                  
                  {/* Media Gallery Preview */}
                  {formData.mediaFiles.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Camera className="h-5 w-5 mr-2 text-purple-600" /> 
                        Uploaded Media ({formData.mediaFiles.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {formData.mediaFiles.map((media, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden shadow-md bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
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
                              <span className="text-xs text-gray-500 truncate max-w-[80%]">{media.name || `File ${index + 1}`}</span>
                              <button
                                type="button"
                                onClick={() => removeMedia(index)}
                                className="text-red-500 rounded-full p-1 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={formData.mediaFiles.length === 0}
                      className={`px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 ${
                        formData.mediaFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Continue to Basic Info
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6 transition-opacity duration-300">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">Pet Basic Information</h2>
                    <p className="text-gray-600 mt-2">Tell us about your pet</p>
                  </div>

                  {/* Two columns for desktop, one column for mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Breed Name */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Breed Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="breed"
                        value={formData.breed}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="e.g., Golden Retriever"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                          className={`py-3 px-4 rounded-lg border ${
                            formData.gender === 'male' 
                              ? 'bg-blue-100 border-blue-500 text-blue-700' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          } transition-colors duration-200 text-center`}
                        >
                          Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                          className={`py-3 px-4 rounded-lg border ${
                            formData.gender === 'female' 
                              ? 'bg-pink-100 border-pink-500 text-pink-700' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          } transition-colors duration-200 text-center`}
                        >
                          Female
                        </button>
                      </div>
                      <input type="hidden" name="gender" value={formData.gender} required />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="e.g., 2 years"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Color <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="e.g., Golden Brown"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.breed || !formData.gender || !formData.age || !formData.color}
                      className={`px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 ${
                        !formData.breed || !formData.gender || !formData.age || !formData.color ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Continue to Details
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-6 transition-opacity duration-300">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">Additional Details</h2>
                    <p className="text-gray-600 mt-2">Final information needed</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Location */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        City/Town <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          placeholder="e.g., Mumbai"
                        />
                      </div>
                    </div>

                    {/* Cost */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Cost <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium">₹</span>
                        </div>
                        <input
                          type="number"
                          name="cost"
                          value={formData.cost}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          placeholder="Enter pet cost"
                        />
                      </div>
                    </div>

                    {/* Vaccine */}
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Vaccination Details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="vaccine"
                        value={formData.vaccine}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="List the vaccinations your pet has received..."
                      ></textarea>
                    </div>
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

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitStatus === 'submitting' || !formData.location || !formData.cost || !formData.vaccine}
                      className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 ${
                        (submitStatus === 'submitting' || !formData.location || !formData.cost || !formData.vaccine) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitStatus === 'submitting' ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Submitting...
                        </div>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Status notifications */}
              {submitStatus === 'success' && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <p className="text-green-800 font-medium">Registration Successful!</p>
                      <p className="text-green-600 text-sm mt-1">Your pet has been registered successfully.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-center">
                    <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <p className="text-red-800 font-medium">Submission Failed</p>
                      <p className="text-red-600 text-sm mt-1">There was an error submitting your registration. Please try again.</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Verification badge information */}
        {!userHasBadge && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Get Verified!</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>Verified users receive more inquiries and have higher trust ratings. Complete your profile to get verified.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}