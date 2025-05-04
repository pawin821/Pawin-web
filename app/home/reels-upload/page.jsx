"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Video, Loader2 } from 'lucide-react';
import { checkUserBadge, saveVideoData } from '../../../firebase/firebase';
import { useAuth } from "@clerk/nextjs";

export default function VideoUploadForm() {
  const { userId, isSignedIn } = useAuth();
  

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    location: '',
    userId: '',
    videoFile: null,
    thumbnailFile: null
  });
  
  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

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

  const handleVideoUploadSuccess = (result) => {
    console.log('Video upload success:', result);
    setIsUploading(false);
    
    if (result.info) {
      // Create video object with all necessary info
      const videoData = {
        url: result.info.secure_url,
        public_id: result.info.public_id,
        resource_type: result.info.resource_type,
        name: result.info.original_filename || 'Uploaded video'
      };
      
      // Add the uploaded video to our state
      setFormData(prev => ({
        ...prev,
        videoFile: videoData
      }));
    }
  };

  const handleThumbnailUploadSuccess = (result) => {
    console.log('Thumbnail upload success:', result);
    setIsUploading(false);
    
    if (result.info) {
      // Create thumbnail object with all necessary info
      const thumbnailData = {
        url: result.info.secure_url,
        public_id: result.info.public_id,
        resource_type: result.info.resource_type,
        name: result.info.original_filename || 'Uploaded thumbnail'
      };
      
      // Add the uploaded thumbnail to our state
      setFormData(prev => ({
        ...prev,
        thumbnailFile: thumbnailData
      }));
    }
  };

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      videoFile: null
    }));
  };

  const removeThumbnail = () => {
    setFormData(prev => ({
      ...prev,
      thumbnailFile: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      // Make sure we have a video
      if (!formData.videoFile) {
        throw new Error("Please upload a video before submitting");
      }
      
      // Prepare video data object for Firebase
      const videoData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        location: formData.location,
        video: {
          url: formData.videoFile.url,
          public_id: formData.videoFile.public_id,
          resource_type: formData.videoFile.resource_type,
          name: formData.videoFile.name
        },
        thumbnail: formData.thumbnailFile ? {
          url: formData.thumbnailFile.url,
          public_id: formData.thumbnailFile.public_id,
          resource_type: formData.thumbnailFile.resource_type,
          name: formData.thumbnailFile.name
        } : null,
        hasBadge: userHasBadge,
        likes: 0,
        views: 0,
        comments: []
      };
      
      // Save video data to Firebase using imported function
      // Pass userId as a separate parameter as expected by the function
      await saveVideoData(videoData, userId);
      
      console.log("Video uploaded successfully:", videoData);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
        location: '',
        userId: userId,
        videoFile: null,
        thumbnailFile: null
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
          <h1 className="text-3xl font-bold text-white text-center">Upload New Reel</h1>
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

            {/* Video Upload with Cloudinary */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Upload Video <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <CldUploadWidget
                  uploadPreset="pawin_123456"
                  onSuccess={handleVideoUploadSuccess}
                  onStart={() => setIsUploading(true)}
                  options={{
                    resourceType: 'video',
                  }}
                >
                  {({ open }) => (
                    <button
                      onClick={() => open()}
                      className="w-full h-40 flex flex-col items-center justify-center space-y-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                      disabled={isUploading || formData.videoFile !== null}
                      type="button"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin">
                            <Loader2 className="w-12 h-12" />
                          </div>
                          <span className="font-semibold">Uploading...</span>
                        </>
                      ) : formData.videoFile ? (
                        <div className="text-center">
                          <Video className="w-12 h-12 mx-auto" />
                          <span className="font-semibold">Video Uploaded</span>
                          <span className="block text-sm">{formData.videoFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Video className="w-12 h-12" />
                          <span className="font-semibold">Click to Upload Video</span>
                          <span className="text-xs opacity-75">MP4, MOV, or WebM format</span>
                        </>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
              
              {/* Video Preview */}
              {formData.videoFile && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Video Preview</h3>
                  <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                    <video 
                      src={formData.videoFile.url} 
                      className="w-full h-full object-contain" 
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Upload Thumbnail (Optional)
              </label>
              <div className="mt-1">
                <CldUploadWidget
                  uploadPreset="pawin_123456"
                  onSuccess={handleThumbnailUploadSuccess}
                  onStart={() => setIsUploading(true)}
                  options={{
                    resourceType: 'image',
                  }}
                >
                  {({ open }) => (
                    <button
                      onClick={() => open()}
                      className="w-full h-32 flex flex-col items-center justify-center space-y-4 bg-gradient-to-r from-blue-400 to-teal-500 hover:from-blue-500 hover:to-teal-600 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                      disabled={isUploading || formData.thumbnailFile !== null}
                      type="button"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin">
                            <Loader2 className="w-12 h-12" />
                          </div>
                          <span className="font-semibold">Uploading...</span>
                        </>
                      ) : formData.thumbnailFile ? (
                        <div className="text-center">
                          <span className="font-semibold">Thumbnail Uploaded</span>
                          <span className="block text-sm">{formData.thumbnailFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8" />
                          <span className="font-medium">Upload Custom Thumbnail</span>
                          <span className="text-xs opacity-75">JPG, PNG, or WebP</span>
                        </>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
              
              {/* Thumbnail Preview */}
              {formData.thumbnailFile && (
                <div className="mt-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden shadow-md bg-white">
                    <Image 
                      src={formData.thumbnailFile.url} 
                      alt="Video thumbnail"
                      fill
                      objectFit="cover"
                      className="rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter reel title"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter reel description"
              ></textarea>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select category</option>
                <option value="pet_care">Pet Care</option>
                <option value="training">Training</option>
                <option value="funny">Funny Moments</option>
                <option value="daily_life">Daily Life</option>
                <option value="adoption">Adoption</option>
                <option value="health">Health & Wellness</option>
                <option value="travel">Pet Travel</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="pet, dog, cat, funny, etc"
              />
              <p className="mt-1 text-sm text-gray-500">Separate tags with commas (e.g., dog, puppy, training)</p>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter location (optional)"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitStatus === 'submitting' || !formData.videoFile}
                className={`px-6 py-3 bg-[#B6DAD9] text-white font-medium rounded-md shadow-md hover:bg-[#9BC0BF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition hover:scale-105 ${
                  (submitStatus === 'submitting' || !formData.videoFile) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {submitStatus === 'submitting' ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading Reel...
                  </div>
                ) : (
                  'Upload Reel'
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
                  <p className="text-green-700">Your reel was uploaded successfully!</p>
                </div>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700">There was an error uploading your reel. Please try again.</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}