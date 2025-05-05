"use client"
import { getUserData, updateBadge } from  '../../../firebase/firebase';
import { useState, useEffect } from 'react';
import { 
  AlertCircle, Award, Check, ChevronDown, ChevronUp, Eye, FileText, 
  Search, X, Shield, Calendar, User, MapPin, Phone, 
  CheckCircle, XCircle, Filter, RefreshCw, Loader,Stethoscope
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from "next/link"; // Make sure this is at the top of your file




const UserVerificationScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
    const { user, isLoaded } = useAuth(); // Get the user object and check if it's loaded
  const [filters, setFilters] = useState({
    userType: 'all',
    petType: 'all',
    location: 'all',
    searchQuery: ''
  });
  const [expandedUser, setExpandedUser] = useState(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [userId,setUserId] = useState(null)
  useEffect(() => {
    if (isLoaded && user) {
      // Access the primary email address
      console.log(user.primaryEmailAddress);
    }
  }, [isLoaded, user]);
  // Fetch users based on filters
  // useEffect(() => {
  //   const fetchUsers = async () => {
    
  //     setLoading(true);
  //     try {
  //       // Only fetch breeders and vets as per requirement
  //       const data = await getUserData(null, {
  //         ...filters,
  //         userType: filters.userType === 'all' ? ['breeder', 'vet'] : filters.userType
  //       });
  //       setUsers(data);
  //       console.log(data)
  //     } catch (error) {
  //       console.error('Error fetching users:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
    
  //   fetchUsers();
  // }, [filters]);
 useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Here we'll use the getUserData function you already have
        const data = await getUserData(null, {
          // Pass the userType filter to the API
          userType: filters.userType === 'petOwner' ? ['breeder', 'vet'] : filters.userType
        });
        
        // Apply client-side filtering for the remaining filters
        let filteredData = data;
        
        // Filter by search term (name or location)
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredData = filteredData.filter(user => 
            (user.name && user.name.toLowerCase().includes(searchLower)) || 
            (user.location && user.location.toLowerCase().includes(searchLower))
          );
        }
        
        // // Filter by verification status
        // if (filters.verificationStatus !== 'all') {
        //   // Assuming verification status is determined by badge field
        //   // Modify this based on how verification is actually stored in your data
        //   if (filters.verificationStatus === 'verified') {
        //     filteredData = filteredData.filter(user => user.badge && user.badge !== '');
        //   } else {
        //     filteredData = filteredData.filter(user => !user.badge || user.badge === '');
        //   }
        // }
        
        setUsers(filteredData);
        console.log('Filtered users:', filteredData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [filters]); // This triggers a new fetch whenever any filter changes


  // Filter change handler
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  // Toggle expanded view for a user
  const toggleUserExpanded = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // View a document
  const viewDocument = (document) => {
    console.log("hi")
    console.log(document)
    setCurrentDocument(document);
    setDocumentViewerOpen(true);
  };

  // Close document viewer
  const closeDocumentViewer = () => {
    setDocumentViewerOpen(false);
    setCurrentDocument(null);
  };

  // Approve a user's documents and update badge
  const approveUser = async (user) => {
    // In a real app, you would update this in Firebase
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        // Update all documents to approved status
        const updatedDocs = u.documents.map(doc => ({
          ...doc,
          status: 'approved'
        }));
        
        // Set badge to 1 (verified)
        return {
          ...u,
          badge: '1',
          documents: updatedDocs
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    // In a real app: Update Firebase here
  };

  // Reject a user's verification
  const rejectUser = async (user) => {
    // In a real app, you would update this in Firebase
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        // Update all documents to rejected status
        const updatedDocs = u.documents.map(doc => ({
          ...doc,
          status: 'rejected'
        }));
        
        // Keep badge as 0 (unverified)
        return {
          ...u,
          badge: '0',
          documents: updatedDocs
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    // In a real app: Update Firebase here
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      userType: 'all',
      verificationStatus: 'all',
      searchTerm: ''
    });
  };

  // Badge status display helper
  const BadgeStatus = ({ status }) => {
    return status === '1' ? (
      <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </span>
    ) : (
      <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  // User type badge
 const UserTypeBadge = ({ type }) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        type === 'breeder'
          ? 'bg-purple-100 text-purple-800'
          : type === 'vet'
          ? 'bg-blue-100 text-blue-800'
          : type === 'petOwner'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {type === 'breeder'
        ? 'Breeder'
        : type === 'vet'
        ? 'Veterinarian'
        : type === 'petOwner'
        ? 'Pet Owner'
        : 'Unknown'}
    </span>
  );
};


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
 <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
  <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-black">Professional Verification Dashboard</h1>
        <p className="text-blue-100 mt-1">Manage breeder and veterinarian verification requests</p>

        {/* Navigation Links */}
        <div className="mt-4 flex space-x-4">
          <Link href="/admin-panel/orders" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-4 py-2 rounded-md font-medium transition duration-150">
            Order
          </Link>
          {/* <Link href="/admin-panel/match" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-4 py-2 rounded-md font-medium transition duration-150">
            Match
          </Link> */}
           <Link href="/admin-panel/donations" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-4 py-2 rounded-md font-medium transition duration-150">
            Donations
          </Link>
          
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-md transition duration-150"
        >
          <Filter className="h-4 w-4 text-black" />
          <span className="text-black">Filters</span>
        </button>
        <button 
          onClick={resetFilters}
          className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-md transition duration-150"
        >
          <RefreshCw className="h-4 w-4 text-black" />
          <span className="text-black">Reset</span>
        </button>
      </div>
    </div>
  </div>
</header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters Panel */}
        {filterOpen && (
          <div className="bg-white rounded-lg shadow-md mb-6 p-5 transform transition-all duration-200 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Filter Options</h2>
              <button 
                onClick={() => setFilterOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name or location..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>
              
              {/* User Type Filter */}
              {/* <div>
                <select
                  className="block w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.userType}
                  onChange={(e) => setFilters({...filters, userType: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="breeder">Breeders Only</option>
                  <option value="vet">Veterinarians Only</option>
                </select>
              </div> */}
              
              {/* Verification Status Filter */}
              <div>
                <select
                  className="block w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.verificationStatus}
                  onChange={(e) => setFilters({...filters, verificationStatus: e.target.value})}
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Pending Verification</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">All Users</p>
              <p className="text-xl font-semibold">{users.length}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Breeders</p>
              <p className="text-xl font-semibold">{users.filter(u => u.userType === 'breeder').length}</p>
            </div>
          
          </div>
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Stethoscope className="h-6 w-6 text-purple-600" />
            </div>
           <div>
              <p className="text-sm text-gray-500">Veterinarians</p>
              <p className="text-xl font-semibold">{users.filter(u => u.userType === 'vet').length}</p>
            </div>
          
          </div>

            
          
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-xl font-semibold">{users.filter(u => u.badge === '1').length}</p>
            </div>
          </div>
          
          {/* <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-semibold">{users.filter(u => u.badge === "").length}</p>
            </div>
          </div> */}
        </div>

        {/* User List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800">Professional Verification Requests</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <p className="text-gray-500">Loading verification requests...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-lg">No verification requests found matching your filters.</p>
              <button 
                onClick={resetFilters}
                className="mt-3 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset Filters
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className={`hover:bg-blue-50 transition duration-150 ${expandedUser === user.id ? 'bg-blue-50' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleUserExpanded(user.id)}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 relative">
                          <img className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"   src={user.profilePhoto || 'https://static.vecteezy.com/system/resources/previews/024/983/914/large_2x/simple-user-default-icon-free-png.png'} 
 alt={user.name} />
                          {user.badge === '1' && (
                            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-lg font-medium text-gray-900">{user.name}</p>
                              {user.userType !== 'petOwner' && (
                            <BadgeStatus status={user.badge} />
                                  )}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <UserTypeBadge type={user.userType} />
                            <div className="flex items-center ml-3">
                              <MapPin className="h-3 w-3 mr-1" />
                              {user.location}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {user.badge === '011' && (
                          <div className="mr-4 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectUser(user);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                approveUser(user);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ap
                            </button>
                          </div>
                        )}
                        {expandedUser === user.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedUser === user.id && (
                      <div className="mt-6 pl-20 pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <User className="h-4 w-4 mr-1 text-blue-500" />
                              Professional Information
                            </h3>
                            <dl className="grid grid-cols-1 gap-2 text-sm">
                              <div className="flex">
                                <dt className="flex items-center text-gray-500 w-32">
                                  <Phone className="h-3 w-3 mr-1" />
                                  Phone:
                                </dt>
                                <dd className="font-medium text-gray-900">{user.phone}</dd>
                              </div>
                              <div className="flex">
                                <dt className="flex items-center text-gray-500 w-32">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Location:
                                </dt>
                                <dd className="font-medium text-gray-900">{user.location}</dd>
                              </div>
                              <div className="flex">
                                <dt className="flex items-center text-gray-500 w-32">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Pet Type:
                                </dt>
                                <dd className="font-medium text-gray-900">{user.petType}</dd>
                              </div>
                              <div className="flex">
                                <dt className="flex items-center text-gray-500 w-32">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Breed:
                                </dt>
                                <dd className="font-medium text-gray-900">{user.breed}</dd>
                              </div>
                              {user.userType === 'vet' && (
                                <div className="flex">
                                  <dt className="flex items-center text-gray-500 w-32">
                                    <Award className="h-3 w-3 mr-1" />
                                    Specialization:
                                  </dt>
                                  <dd className="font-medium text-gray-900">{user.vet}</dd>
                                </div>
                              )}
                              {user.userType === 'breeder' && (
                                <div className="flex">
                                  <dt className="flex items-center text-gray-500 w-32">
                                    <Award className="h-3 w-3 mr-1" />
                                    Experience:
                                  </dt>
                                  <dd className="font-medium text-gray-900">{user.experience || "Not specified"} years</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                              Verification Documents
                            </h3>
                            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
                              {user.documents.map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between py-3 px-4 text-sm">
                                  <div className="flex items-center max-w-xs">
                                    <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                    <span className="truncate">{doc.name}</span>
                                    {doc.status === 'approved' && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="h-3 w-3 mr-1" />
                                        <div> Approved </div>  
                                      </span>
                                    )}
                                    {doc.status === 'rejected' && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <X className="h-3 w-3 mr-1" />
                                        Rejected
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition duration-150"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUserId(user.id)
                                      viewDocument(user.documents[0].url);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Document Viewer Modal */}
      {documentViewerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-3/4 overflow-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                {currentDocument?.name}
              </h2>
              <button onClick={closeDocumentViewer} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50">
                    <img src={currentDocument} alt="Dynamic Image" />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                {currentDocument?.status !== 'approved' && currentDocument?.status !== 'rejected' && (
                  <>
                    <button onClick={()=>{updateBadge(userId,""); console.log(userId); window.location.reload()}}
                      className="px-4 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Document
                    </button>
                    <button onClick={()=>{updateBadge(userId,"1"); console.log(userId); window.location.reload()}}
                      className="px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Document
                    </button>
                  </>
                )}
                <button
                  onClick={closeDocumentViewer}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerificationScreen;