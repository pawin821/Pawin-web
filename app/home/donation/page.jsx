"use client"
import { useState, useEffect } from 'react';
import { Heart, DollarSign, CreditCard, Check, AlertCircle, PawPrint } from 'lucide-react';
import {saveDonation} from '../../../firebase/firebase'
export default function DogDonationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [donationComplete, setDonationComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const predefinedAmounts = [100, 500, 1000, 5000];

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAmountSelection = (selectedAmount) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomAmount(value);
      if (value !== '') {
        setAmount(parseInt(value, 10));
      } else {
        setAmount(0);
      }
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return false;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please enter a valid email');
      return false;
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone)) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return false;
    }
    if (amount <= 0) {
      setErrorMessage('Please enter a valid donation amount');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setPaymentLoading(true);
    
    try {
      const donationId = 'don_' + new Date().getTime();
      
      const options = {
        key: "rzp_live_zrvbyqISpF58jd", // Your Razorpay key
        amount: amount * 100, // Amount in paise
        currency: "INR",
        name: "Paws for a Cause",
        description: `Donation for Dogs`,
        image: "http://eskipaper.com/images/happy-dog-2.jpg", // Placeholder image
        handler: function (response) {
          // This function runs when payment is successful
          const donationData = {
            name,
            email,
            phone,
            amount,
            message,
            timestamp: new Date().toISOString(),
            paymentId: response.razorpay_payment_id
          };
          
          if (response.razorpay_payment_id) {
            console.log("Payment successful!", response);
            setPaymentLoading(false);
            
            saveDonation(donationId, donationData)
              .then(() => {
                console.log('Donation saved successfully');
                setDonationComplete(true);
              })
              .catch((error) => {
                console.error('Failed to save donation:', error);
                setErrorMessage('Your payment was processed but there was an error saving your donation details. Please contact support.');
              });
            
            // Store payment info locally if needed
            localStorage.setItem("donation_success", "true");
            localStorage.setItem("payment_id", response.razorpay_payment_id);
          } else {
            setErrorMessage("Payment was not completed successfully.");
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
            console.log("Payment modal closed without payment");
            setErrorMessage("Payment cancelled. Please try again.");
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        notes: {
          donationId: donationId
        },
        theme: {
          color: "#3B82F6"
        }
      };
      
      // Check if Razorpay is loaded in the window object
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setErrorMessage("Razorpay SDK failed to load. Please check your internet connection.");
        setPaymentLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage("Payment failed to initialize. Please try again.");
      setPaymentLoading(false);
    }
  };

  if (donationComplete) {
    return (
      <div className="min-h-screen bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Your Donation!</h2>
            <p className="text-gray-600 mb-6">Your contribution will help dogs in need.</p>
            <button 
              onClick={() => {
                setDonationComplete(false);
                setName('');
                setEmail('');
                setPhone('');
                setAmount(100);
                setCustomAmount('');
                setMessage('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300"
            >
              Make Another Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Paws for a Cause</h1>
          <p className="mt-2 text-lg text-gray-600">Your donation helps rescue dogs find forever homes</p>
        </div>
        
        {/* Main Card */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Hero Image */}
          <div className="h-48 bg-gray-200 relative">
            <img 
              src="http://eskipaper.com/images/happy-dog-2.jpg" 
              alt="Happy rescue dogs" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
              <div className="p-4 text-white">
                <h2 className="text-xl font-bold">Help Us Save More Dogs</h2>
                <p className="text-sm">Providing shelter, food, and medical care</p>
              </div>
            </div>
          </div>
          
          {/* Donation Form */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Personal Information */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  placeholder="10-digit phone number"
                />
              </div>
              
              {/* Donation Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount (INR)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {predefinedAmounts.map((predefinedAmount) => (
                    <button
                      key={predefinedAmount}
                      type="button"
                      onClick={() => handleAmountSelection(predefinedAmount)}
                      className={`py-2 px-4 rounded-lg border ${
                        amount === predefinedAmount && customAmount === '' 
                          ? 'bg-blue-100 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ₹{predefinedAmount}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700">Custom Amount</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      id="customAmount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message (Optional)</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  placeholder="Add a personal message..."
                />
              </div>
              
              {/* Submit Button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={paymentLoading}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ${
                  paymentLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Donate ₹{amount}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Impact Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <PawPrint className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Rescue</h3>
            <p className="mt-1 text-sm text-gray-500">Help us rescue dogs from harmful situations</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Care</h3>
            <p className="mt-1 text-sm text-gray-500">Provide medical care and rehabilitation</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Support</h3>
            <p className="mt-1 text-sm text-gray-500">Fund shelter operations and adoption programs</p>
          </div>
        </div>
        
        {/* Trust & Security */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Secure payment processing by Razorpay</p>
          <p className="mt-1">100% of your donation goes directly to helping dogs in need</p>
        </div>
      </div>
    </div>
  );
}