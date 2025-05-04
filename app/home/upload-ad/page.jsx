"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2 } from 'lucide-react';
import { checkUserBadge, saveAdaptionData } from '../../../firebase/firebase';

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
    userId: '',
    mediaFiles: [],
    latitude: '',
    longitude: ''
  });

  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

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

      // Ask for geolocation permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            }));
          },
          (error) => {
            console.warn("Geolocation permission denied or error:", error);
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    const adoptionData = {
      ...formData,
      media: formData.mediaFiles,
      hasBadge: userHasBadge,
      createdAt: new Date()
    };

    try {
      await saveAdaptionData(adoptionData, userId);
      setSubmitStatus('success');
      setFormData({
        breed: '',
        gender: '',
        age: '',
        location: '',
        color: '',
        vaccine: '',
        userId: userId,
        mediaFiles: [],
        latitude: '',
        longitude: ''
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#FFC107] py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Pet Adoption Form</h1>
        </div>

        <div className="p-8">
          {userHasBadge && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
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
  label="Location"
  name="location"
  value={formData.location}
  onChange={handleInputChange}
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
  label="Vaccination Status"
  name="vaccine"
  value={formData.vaccine}
  onChange={handleInputChange}
  required
/>

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
              {submitStatus === 'submitting' ? 'Submitting...' : 'Submit for Adoption'}
            </button>
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
        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}
