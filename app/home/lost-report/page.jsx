"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, MapPin } from 'lucide-react';
import { checkUserBadge, saveLostReport } from '../../../firebase/firebase';

import { useAuth } from "@clerk/nextjs";

export default function LostReportForm() {
  const { userId } = useAuth();

  const [formData, setFormData] = useState({
    breed: '',
    gender: '',
    age: '',
    color: '',
    vaccine: '',
    lostAddress: '',
    foundAddress: '',
    userId: '',
    latitude: null,
    longitude: null,
    mediaFiles: []
  });

  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [geoStatus, setGeoStatus] = useState('');

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
      setIsLoading(false);
    };

    fetchUserData();
    
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
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    // Try to get current location one more time if not available
    if (!formData.latitude || !formData.longitude) {
      refreshGeolocation();
    }

    const lostData = {
      ...formData,
      media: formData.mediaFiles,
      hasBadge: userHasBadge,
      createdAt: new Date()
    };

    try {
      await saveLostReport(userId, lostData);
      setSubmitStatus('success');
      setFormData({
        breed: '',
        gender: '',
        age: '',
        color: '',
        vaccine: '',
        lostAddress: '',
        foundAddress: '',
        userId: userId,
        latitude: formData.latitude,
        longitude: formData.longitude,
        mediaFiles: []
      });
    } catch (error) {
      console.error("Error submitting lost report:", error);
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
        <div className="bg-[#29d219] py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Report Lost Pet</h1>
        </div>

        <div className="p-8">
          {userHasBadge && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-200 p-4 rounded">
              <p className="text-yellow-700 font-medium">Verified Badge User</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
     <InputField
  label="Breed"
  name="breed"
  value={formData.breed}
  onChange={handleInputChange}
  required
/>
<InputField
  label="Gender"
  name="gender"
  value={formData.gender}
  onChange={handleInputChange}
  required
/>
<InputField
  label="Age"
  name="age"
  value={formData.age}
  onChange={handleInputChange}
  type="number"
  required
/>
<InputField
  label="Color"
  name="color"
  value={formData.color}
  onChange={handleInputChange}
  required
/>
<InputField
  label="Lost Address"
  name="lostAddress"
  value={formData.lostAddress}
  onChange={handleInputChange}
  required
/>

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
                <div className="text-red-500 text-sm mb-2">
                  Unable to get your location. Please ensure location permissions are enabled.
                </div>
              )}
              
              <button
                type="button"
                onClick={refreshGeolocation}
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded transition"
              >
                Refresh Location
              </button>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Upload Photos/Videos</label>
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
                        <span>Click to Upload</span>
                      </>
                    )}
                  </button>
                )}
              </CldUploadWidget>
            </div>

            {formData.mediaFiles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Uploaded Media</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={media.url}
                        alt={media.name}
                        width={200}
                        height={200}
                        className="rounded-md object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-yellow-600 text-white rounded-md font-semibold hover:bg-yellow-700 transition"
            >
              {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Lost Report'}
            </button>
            
            {submitStatus === 'success' && (
              <div className="mt-4 bg-green-100 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700">Report submitted successfully!</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">Error submitting report. Please try again.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
      />
    </div>
  );
}