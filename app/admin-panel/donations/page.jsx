"use client"
import { useState, useEffect } from 'react';
import { Heart, Dog, DollarSign, CreditCard, Check, AlertCircle, Users, Calendar, Search } from 'lucide-react';
import { getAllDonations } from '../../../firebase/firebase';


export default function DonationDashboard() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'donation-form'
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAmount, setFilterAmount] = useState('all');
  
  // Donation form states
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
    if (view === 'dashboard') {
      loadDonations();
    }
    
    // Load Razorpay script when in donation form view
    if (view === 'donation-form') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [view]);

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDonations();
      setDonations(data);
      setError(null);
    } catch (err) {
      console.error("Error loading donations:", err);
      setError("Failed to load donations data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dashboard stats calculations
  const totalDonations = donations.length;
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Filter donations based on search term and amount filter
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === '' || 
      donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterAmount === 'all') return matchesSearch;
    if (filterAmount === 'under500' && donation.amount < 500) return matchesSearch;
    if (filterAmount === '500to1000' && donation.amount >= 500 && donation.amount <= 1000) return matchesSearch;
    if (filterAmount === 'over1000' && donation.amount > 1000) return matchesSearch;
    
    return false;
  });

  // Donation form functions
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
        image: "/api/placeholder/100/100", // Placeholder image
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
                // Reload donations in dashboard after successful donation
                loadDonations();
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

  // Render the donations dashboard
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation bar */}
        <div className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Dog className="h-8 w-8" />
              <h1 className="text-xl font-bold">Paws for a Cause</h1>
            </div>
            <button 
              onClick={() => setView('donation-form')}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              Make a Donation
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Donations Dashboard</h1>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Donations</p>
                  <p className="text-3xl font-bold text-gray-900">{totalDonations}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Donation</p>
                  <p className="text-3xl font-bold text-gray-900">₹{averageDonation.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter and search */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search donations..."
                  className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by amount:</label>
                <select 
                  value={filterAmount}
                  onChange={(e) => setFilterAmount(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Amounts</option>
                  <option value="under500">Under ₹500</option>
                  <option value="500to1000">₹500 - ₹1000</option>
                  <option value="over1000">Over ₹1000</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Donations table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading donations...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Donor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Message
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No donations found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDonations.map((donation) => (
                          <tr key={donation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{donation.name}</div>
                              <div className="text-xs text-gray-500">{donation.email}</div>
                              <div className="text-xs text-gray-500">{donation.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">₹{donation.amount.toLocaleString('en-IN')}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(donation.timestamp)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {donation.message || <span className="text-gray-400 italic">No message</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {donation.paymentId}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 text-center">
                  <p className="text-sm text-gray-500">
                    Showing {filteredDonations.length} of {totalDonations} donations
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}