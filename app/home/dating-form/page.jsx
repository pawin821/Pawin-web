"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2 } from 'lucide-react';
import { checkUserBadge, savePetDatingProfile } from '../../../firebase/firebase';

import { useAuth } from "@clerk/nextjs";

export default function PetDatingProfileForm() {
  const { userId } = useAuth();

  const [formData, setFormData] = useState({
    petName: '',
    breed: '',
    gender: '',
    age: '',
    personality: '',
    likes: '',
    dislikes: '',
    location: '',
    userId: '',
    mediaFiles: []
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

    const petProfileData = {
      ...formData,
      media: formData.mediaFiles,
      hasBadge: userHasBadge,
      createdAt: new Date()
    };

    try {
      await savePetDatingProfile(userId, petProfileData);
      setSubmitStatus('success');
      setFormData({
        petName: '',
        breed: '',
        gender: '',
        age: '',
        personality: '',
        likes: '',
        dislikes: '',
        location: '',
        userId: userId,
        mediaFiles: []
      });
    } catch (error) {
      console.error("Error submitting pet dating profile:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-pink-500 py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Create Pet Dating Profile</h1>
        </div>

        <div className="p-8">
          {userHasBadge && (
            <div className="mb-6 bg-pink-100 border-l-4 border-pink-500 p-4 rounded">
              <p className="text-pink-700 font-medium">Verified Badge User</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
  label="Pet Name"
  name="petName"
  value={formData.petName}
  onChange={handleInputChange}
  required
/>

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

              <InputField   required type="number" label="Age" name="age" value={formData.age} onChange={handleInputChange} />
              <div className="sm:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">Personality</label>
                <textarea
                  name="personality"
                  value={formData.personality}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500"
                  rows="3"
                />
              </div>

              <InputField label="Location" name="location" value={formData.location} onChange={handleInputChange} />
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
                    className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg shadow-md transition hover:scale-105"
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
                        <span>Click to Upload Pet Photos</span>
                      </>
                    )}
                  </button>
                )}
              </CldUploadWidget>
            </div>

            {formData.mediaFiles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Uploaded Photos</h3>
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

            {submitStatus === 'success' && (
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700">Pet dating profile created successfully!</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">There was an error creating your pet's profile. Please try again.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-pink-600 text-white rounded-md font-semibold hover:bg-pink-700 transition"
              disabled={submitStatus === 'submitting'}
            >
              {submitStatus === 'submitting' ? 'Creating Profile...' : 'Create Pet Dating Profile'}
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
        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500"
      />
    </div>
  );
}