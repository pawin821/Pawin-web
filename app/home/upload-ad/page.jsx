"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, MapPin, AlertCircle, Check, X, Shield } from 'lucide-react';
import { checkUserBadge, saveAdaptionData, sendBroadcastNotification } from '../../../firebase/firebase';

import { useAuth } from "@clerk/nextjs";

export default function AdoptionForm() {
  const { userId } = useAuth();

  const [formData, setFormData] = useState({
    breed: '',
    gender: '',
    age: '',
    location: '',
    color: '',
    vaccine: '',
    petName: '',
    description: '',
    userId: '',
    mediaFiles: [],
    latitude: null,
    longitude: null
  });

  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        setFormData(prev => ({ ...prev, userId }));
        try {
          const hasBadge = await checkUserBadge(userId);
          setUserHasBadge(hasBadge);
        } catch (error) {
          console.error("Error checking user badge:", error);
        }
      }

      // Get geolocation when component mounts
      if (navigator.geolocation) {
        setGeoStatus('fetching');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
            setGeoStatus('success');
          },
          (error) => {
            console.error("Error getting geolocation:", error);
            setGeoStatus('error');
          }
        );
      } else {
        setGeoStatus('unavailable');
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, [userId]);

  const validateField = (name, value) => {
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    
    if (name === 'age') {
      if (isNaN(value) || parseInt(value) <= 0) {
        return 'Age must be a positive number';
      }
    }
    
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setFormTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate and update errors
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender }));
    setFormTouched(prev => ({ ...prev, gender: true }));
    setErrors(prev => ({
      ...prev,
      gender: gender ? '' : 'Gender is required'
    }));
  };

  const handleVaccineSelect = (vaccine) => {
    setFormData(prev => ({ ...prev, vaccine }));
    setFormTouched(prev => ({ ...prev, vaccine: true }));
    setErrors(prev => ({
      ...prev,
      vaccine: vaccine ? '' : 'Vaccination status is required'
    }));
  };

  const handleMediaUploadSuccess = (result) => {
    setIsUploading(false);
    if (result.info) {
      const newMedia = {
        url: result.info.secure_url,
        public_id: result.info.public_id,
        resource_type: result.info.resource_type,
        name: result.info.original_filename || 'Uploaded file'
      };
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

  const refreshGeolocation = () => {
    if (navigator.geolocation) {
      setGeoStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setGeoStatus('success');
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setGeoStatus('error');
        }
      );
    }
  };

  const validateForm = () => {
    // Mark all fields as touched
    const allFields = {
      breed: true,
      gender: true,
      age: true,
      color: true,
      location: true,
      vaccine: true,
      petName: true
    };
    setFormTouched(allFields);
    
    // Validate all fields
    const newErrors = {};
    for (const [key, value] of Object.entries(formData)) {
      if (['breed', 'gender', 'age', 'color', 'location', 'vaccine', 'petName'].includes(key)) {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submitting
    if (!validateForm()) {
      return;
    }
    
    setSubmitStatus('submitting');

    // Try to get current location one more time if not available
    if (!formData.latitude || !formData.longitude) {
      refreshGeolocation();
    }

    const adoptionData = {
      ...formData,
      media: formData.mediaFiles,
      hasBadge: userHasBadge,
      createdAt: new Date()
    };

    try {
      // Save the adoption data
      const adoptionId = await saveAdaptionData(adoptionData, userId);
      setSubmitStatus('success');
      
      // Send broadcast notification to all FCM tokens
      try {
        setNotificationStatus('sending');
        const petType = formData.breed || 'pet';
        const location = formData.location || 'unknown location';
        const notificationData = {
          title: `PET FOR ADOPTION: ${formData.petName || petType}`,
          body: `A ${formData.color || ''} ${petType} is available for adoption in ${location}. Help find a forever home!`,
          adoptionId: adoptionId,
          imageUrl: formData.mediaFiles.length > 0 ? formData.mediaFiles[0].url : null
        };
        
        await sendBroadcastNotification(notificationData);
        setNotificationStatus('success');
      } catch (notificationError) {
        console.error("Error sending broadcast notification:", notificationError);
        setNotificationStatus('error');
      }
      
      // Reset form
      setFormData({
        breed: '',
        gender: '',
        age: '',
        location: '',
        color: '',
        vaccine: '',
        petName: '',
        description: '',
        userId: userId,
        latitude: formData.latitude,
        longitude: formData.longitude,
        mediaFiles: []
      });
      setFormTouched({});
      setErrors({});
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#FFC107] py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Pet Adoption Form</h1>
        </div>

        <div className="p-8">
          {userHasBadge && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded flex items-center">
              <Shield className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-700 font-medium">Verified Badge User</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Pet Name"
                name="petName"
                value={formData.petName}
                onChange={handleInputChange}
                error={formTouched.petName && errors.petName}
                placeholder="e.g., Max, Bella"
              />
              
              <InputField
                label="Pet Type/Breed"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                error={formTouched.breed && errors.breed}
                placeholder="e.g., Golden Retriever, Siamese Cat"
              />
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Gender <span className="text-red-500">*</span></label>
                <div className="flex items-center space-x-4">
                  <GenderButton 
                    selected={formData.gender === 'Male'} 
                    onClick={() => handleGenderSelect('Male')}
                    label="Male"
                    color="blue"
                  />
                  <GenderButton 
                    selected={formData.gender === 'Female'} 
                    onClick={() => handleGenderSelect('Female')}
                    label="Female"
                    color="pink"
                  />
                </div>
                {formTouched.gender && errors.gender && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>
              
              <InputField
                label="Age (Years)"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                error={formTouched.age && errors.age}
                type="number"
                placeholder="e.g., 3"
              />
              
              <InputField
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                error={formTouched.color && errors.color}
                placeholder="e.g., Brown and White"
              />
              
              <InputField
                label="City/Towm"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                error={formTouched.location && errors.location}
                placeholder="e.g., Vizag,Srikakulam"
              />
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Vaccination Status <span className="text-red-500">*</span></label>
                <div className="flex items-center space-x-4">
                  <VaccineButton 
                    selected={formData.vaccine === 'Vaccinated'} 
                    onClick={() => handleVaccineSelect('Vaccinated')}
                    label="Vaccinated"
                    color="green"
                  />
                  <VaccineButton 
                    selected={formData.vaccine === 'Not Vaccinated'} 
                    onClick={() => handleVaccineSelect('Not Vaccinated')}
                    label="Not Vaccinated"
                    color="red"
                  />
                  <VaccineButton 
                    selected={formData.vaccine === 'Partial'} 
                    onClick={() => handleVaccineSelect('Partial')}
                    label="Partial"
                    color="yellow"
                  />
                </div>
                {formTouched.vaccine && errors.vaccine && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.vaccine}
                  </p>
                )}
              </div>
              
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about the pet's personality, needs, and why they need a new home..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                ></textarea>
              </div>
            </div>
            
            <div className="border p-4 rounded-md bg-gray-50">
              <div className="flex items-center mb-2">
                <MapPin className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="font-semibold text-gray-800">Location Data (Automatic)</h3>
              </div>
              
              {geoStatus === 'fetching' && (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Getting your location...</span>
                </div>
              )}
              
              {geoStatus === 'success' && (
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Latitude:</span> {formData.latitude?.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Longitude:</span> {formData.longitude?.toFixed(6)}
                  </div>
                </div>
              )}
              
              {(geoStatus === 'error' || geoStatus === 'unavailable') && (
                <div className="text-red-500 text-sm mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unable to get your location. Please ensure location permissions are enabled.
                </div>
              )}
              
              <button
                type="button"
                onClick={refreshGeolocation}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded transition flex items-center"
              >
                <Loader2 className={`w-3 h-3 mr-1 ${geoStatus === 'fetching' ? 'animate-spin' : ''}`} />
                Refresh Location
              </button>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Upload Photos/Videos <span className="text-red-500">*</span></label>
              <CldUploadWidget
                uploadPreset="pawin_123456"
                onSuccess={handleMediaUploadSuccess}
                onStart={() => setIsUploading(true)}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg shadow-md transition hover:scale-105"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10" />
                        <span className="mt-2 font-medium">Click to Upload</span>
                        <span className="text-xs mt-1 opacity-80">Good photos increase adoption chances</span>
                      </>
                    )}
                  </button>
                )}
              </CldUploadWidget>
              {formTouched.mediaFiles && formData.mediaFiles.length === 0 && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  At least one photo is required
                </p>
              )}
            </div>

            {formData.mediaFiles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Uploaded Media ({formData.mediaFiles.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={media.url}
                        alt={media.name}
                        width={200}
                        height={200}
                        className="rounded-md object-cover h-40 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className={`w-full py-3.5 text-white rounded-md font-semibold transition flex items-center justify-center
                  ${submitStatus === 'submitting' 
                    ? 'bg-yellow-400 cursor-not-allowed' 
                    : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {submitStatus === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Adoption'
                )}
              </button>
            </div>
            
            {submitStatus === 'success' && (
              <div className="mt-4 bg-green-100 border-l-4 border-green-500 p-4 rounded flex">
                <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">Adoption listing submitted successfully!</p>
                  {notificationStatus === 'sending' && (
                    <p className="text-green-600 mt-1 text-sm">Sending broadcast notifications...</p>
                  )}
                  {notificationStatus === 'success' && (
                    <p className="text-green-600 mt-1 text-sm">Alert sent to all potential adopters!</p>
                  )}
                  {notificationStatus === 'error' && (
                    <p className="text-orange-600 mt-1 text-sm">Listing saved but there was an issue sending notifications.</p>
                  )}
                </div>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 rounded flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700">Error submitting adoption listing. Please try again.</p>
                  <p className="text-red-600 mt-1 text-sm">If the problem persists, please contact support.</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, error, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-md focus:ring-2 focus:ring-yellow-500 
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

function GenderButton({ selected, onClick, label, color }) {
  const baseClasses = "flex-1 py-2.5 rounded-md transition-all focus:outline-none font-medium";
  const selectedClasses = {
    blue: "bg-blue-100 border-blue-500 text-blue-700 border-2",
    pink: "bg-pink-100 border-pink-500 text-pink-700 border-2"
  };
  const unselectedClasses = "bg-gray-100 border-gray-300 text-gray-600 border hover:bg-gray-200";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${selected ? selectedClasses[color] : unselectedClasses}`}
    >
      {label}
    </button>
  );
}

function VaccineButton({ selected, onClick, label, color }) {
  const baseClasses = "flex-1 py-2 rounded-md transition-all focus:outline-none text-sm font-medium";
  const selectedClasses = {
    green: "bg-green-100 border-green-500 text-green-700 border-2",
    red: "bg-red-100 border-red-500 text-red-700 border-2",
    yellow: "bg-yellow-100 border-yellow-500 text-yellow-700 border-2"
  };
  const unselectedClasses = "bg-gray-100 border-gray-300 text-gray-600 border hover:bg-gray-200";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${selected ? selectedClasses[color] : unselectedClasses}`}
    >
      {label}
    </button>
  );
}