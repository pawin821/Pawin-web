"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, Loader2, AlertCircle, X, CheckCircle, Camera, CreditCard } from 'lucide-react';
import { checkUserBadge, savePetDatingProfile, saveOrder } from '../../../firebase/firebase';
import { useAuth } from "@clerk/nextjs";
import Script from 'next/script';

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

  const [errors, setErrors] = useState({});
  const [userHasBadge, setUserHasBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Profile creation pricing
  const PROFILE_COST = 59; // in INR

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.petName.trim()) newErrors.petName = "Pet name is required";
    if (!formData.breed.trim()) newErrors.breed = "Breed is required";
    if (!formData.gender) newErrors.gender = "Gender selection is required";
    
    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (isNaN(formData.age) || parseInt(formData.age) <= 0) {
      newErrors.age = "Age must be a positive number";
    }
    
    if (!formData.personality.trim()) newErrors.personality = "Personality description is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    
    if (formData.mediaFiles.length === 0) {
      newErrors.media = "Please upload at least one photo";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: undefined }));
    }
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
      
      // Clear media error if it exists
      if (errors.media) {
        setErrors(prev => ({ ...prev, media: undefined }));
      }
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  // Initialize Razorpay payment
  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // This is a simple client-side implementation
      const options = {
        key: "rzp_live_zrvbyqISpF58jd", // Your Razorpay key
        amount: PROFILE_COST * 100, // Amount in paise
        currency: "INR",
        name: "Pet Dating Profile",
        description: `Payment for creating ${formData.petName}'s dating profile`,
        image: formData.mediaFiles[0]?.url || "",
        handler: function (response) {
          // This function runs when payment is successful
          const order = {
            petId: formData.petName,
            buyerId: userId,
            price: PROFILE_COST,
            sellerId: "platform" // Platform itself
          };
          
          if (response.razorpay_payment_id) {
            // Payment successful - user has paid
            console.log("Payment successful!", response);
            setPaymentComplete(true);
            setPaymentLoading(false);
            
            // Save the order record
            saveOrder(order)
              .then((orderId) => {
                console.log('Payment recorded with ID:', orderId);
                // Proceed with profile creation
                submitProfileData();
              })
              .catch((error) => {
                console.error('Failed to record payment:', error);
                setSubmitStatus('error');
                alert("Payment recorded but failed to save profile. Please contact support.");
              });
          } else {
            // This shouldn't happen with Razorpay but just in case
            alert("Payment was not completed successfully.");
            setPaymentLoading(false);
          }
        },
        // This triggers if user closes the payment modal without paying
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
            console.log("Payment modal closed without payment");
            alert("Payment cancelled. Please try again.");
          }
        },
        prefill: {
          name: formData.petName,
          email: "",
          contact: ""
        },
        notes: {
          petName: formData.petName,
          userId: userId
        },
        theme: {
          color: "#EC4899" // Pink color to match the form theme
        }
      };
      
      // Check if Razorpay is loaded in the window object
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed to initialize. Please try again.");
      setPaymentLoading(false);
    }
  };

  const submitProfileData = async () => {
    setSubmitStatus('submitting');

    const petProfileData = {
      ...formData,
      media: formData.mediaFiles,
      hasBadge: userHasBadge,
      createdAt: new Date(),
      paymentComplete: true,
      paymentAmount: PROFILE_COST
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
      
      // Auto-scroll to success message
      setTimeout(() => {
        const successMsg = document.getElementById('success-message');
        if (successMsg) successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
    } catch (error) {
      console.error("Error submitting pet dating profile:", error);
      setSubmitStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Show payment before submitting form
    setShowPayment(true);
    
    // Auto-scroll to payment section
    setTimeout(() => {
      const paymentSection = document.getElementById('payment-section');
      if (paymentSection) paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Create Pet Dating Profile</h1>
          {userHasBadge && (
            <div className="mt-2 flex justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400 text-yellow-800">
                <CheckCircle className="w-4 h-4 mr-1" /> Verified Badge
              </span>
            </div>
          )}
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pet Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="petName"
                  value={formData.petName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    errors.petName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your pet's name"
                />
                {errors.petName && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.petName}
                  </p>
                )}
              </div>

              {/* Breed */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Breed <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    errors.breed ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="E.g., Golden Retriever, Persian Cat"
                />
                {errors.breed && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.breed}
                  </p>
                )}
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleGenderSelect('Male')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      formData.gender === 'Male'
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderSelect('Female')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      formData.gender === 'Female'
                        ? 'bg-pink-100 border-pink-500 text-pink-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Female
                  </button>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.gender}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Pet's age"
                />
                {errors.age && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.age}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-medium mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="City, State"
                />
                {errors.location && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.location}
                  </p>
                )}
              </div>

              {/* Personality */}
              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-medium mb-1">
                  Personality <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="personality"
                  value={formData.personality}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 ${
                    errors.personality ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="3"
                  placeholder="Describe your pet's personality"
                />
                {errors.personality && (
                  <p className="mt-1 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> {errors.personality}
                  </p>
                )}
              </div>

              {/* Likes */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Likes
                </label>
                <input
                  type="text"
                  name="likes"
                  value={formData.likes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                  placeholder="What your pet enjoys"
                />
              </div>

              {/* Dislikes */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Dislikes
                </label>
                <input
                  type="text"
                  name="dislikes"
                  value={formData.dislikes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
                  placeholder="What your pet dislikes"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="mt-8">
              <label className="block text-gray-700 font-medium mb-2">
                Upload Photos/Videos <span className="text-red-500">*</span>
              </label>
              <CldUploadWidget
                uploadPreset="pawin_123456"
                onSuccess={handleMediaUploadSuccess}
                onStart={() => setIsUploading(true)}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className={`w-full h-40 flex flex-col items-center justify-center rounded-lg shadow-md transition hover:scale-105 ${
                      errors.media
                        ? 'bg-red-50 border-2 border-dashed border-red-400 text-red-500'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    }`}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span className="mt-2 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-10 h-10" />
                        <span className="mt-2 font-medium">Upload Pet Photos</span>
                        <span className="text-sm opacity-80">Click to browse files</span>
                      </>
                    )}
                  </button>
                )}
              </CldUploadWidget>
              {errors.media && (
                <p className="mt-1 text-red-500 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.media}
                </p>
              )}
            </div>

            {/* Uploaded Media Display */}
            {formData.mediaFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Uploaded Photos ({formData.mediaFiles.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.mediaFiles.map((media, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-md h-40">
                      <Image
                        src={media.url}
                        alt={media.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition shadow-md"
                        aria-label="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Section */}
            {showPayment && (
              <div id="payment-section" className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Complete Payment</h3>
                
                <div className="bg-white p-4 rounded-md shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Creating profile for {formData.petName}</span>
                    <span className="text-gray-700">₹{PROFILE_COST}.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-lg text-gray-900">₹{PROFILE_COST}.00</span>
                  </div>
                </div>
                
                {paymentComplete ? (
                  <div className="bg-green-100 p-4 rounded-md border border-green-300 flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-800">Payment Successful!</p>
                      <p className="text-green-700 text-sm">Your profile is being created...</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className={`w-full py-3 rounded-md font-semibold transition shadow-md flex items-center justify-center ${
                      paymentLoading
                        ? 'bg-gray-400 cursor-not-allowed text-gray-100'
                        : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white'
                    }`}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ₹{PROFILE_COST}.00
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div id="success-message" className="bg-green-100 border-l-4 border-green-500 p-4 rounded mt-6 flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">Pet dating profile created successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Your pet's profile is now live and ready for connections.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded mt-6 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">There was an error creating your pet's profile.</p>
                  <p className="text-red-600 text-sm mt-1">Please try again or contact support if the problem persists.</p>
                </div>
              </div>
            )}

            {/* Submit Button - only show if payment is not initiated yet */}
            {!showPayment && (
              <button
                type="submit"
                className="w-full py-3 mt-6 text-white rounded-md font-semibold transition shadow-md bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                Continue to Payment
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}