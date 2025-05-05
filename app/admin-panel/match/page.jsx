"use client"
import { useState, useEffect } from 'react';
import { Search, Heart, Calendar, Clock, ChevronDown, ChevronUp, User, Filter, X } from 'lucide-react';
import { auth, getMatchData } from '../../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // If you're using App Router

// // Simulating Firebase import and getMatchData function
// const getMatchData = () => {
//   // This would be your actual Firebase function
//   return Promise.resolve([
//     {
//       id: "match001",
//       dogA: "user_abc",
//       dogB: "user_xyz",
//       timestamp: "2025-05-01T14:30:00",
//       status: "Matched",
//       matchScore: 95,
//       dogAUser: { 
//         id: "user_abc", 
//         name: "Max", 
//         breed: "Golden Retriever",
//         age: 3,
//         gender: "Male",
//         owner: "Sarah Johnson",
//         phone: "+1 (555) 123-4567",
//         image: "/api/placeholder/200/200"
//       },
//       dogBUser: { 
//         id: "user_xyz", 
//         name: "Bella", 
//         breed: "Labrador Retriever",
//         age: 2,
//         gender: "Female",
//         owner: "Michael Smith",
//         phone: "+1 (555) 234-5678",
//         image: "/api/placeholder/200/200"
//       }
//     },
//     {
//       id: "match002",
//       dogA: "user_def",
//       dogB: "user_uvw",
//       timestamp: "2025-05-02T09:45:00",
//       status: "Pending",
//       matchScore: 87,
//       dogAUser: { 
//         id: "user_def", 
//         name: "Charlie", 
//         breed: "French Bulldog",
//         age: 4,
//         gender: "Male",
//         owner: "Emma Davis",
//         phone: "+1 (555) 345-6789",
//         image: "/api/placeholder/200/200"
//       },
//       dogBUser: { 
//         id: "user_uvw", 
//         name: "Luna", 
//         breed: "Poodle",
//         age: 3,
//         gender: "Female",
//         owner: "Daniel Brown",
//         phone: "+1 (555) 456-7890",
//         image: "/api/placeholder/200/200"
//       }
//     },
//     {
//       id: "match003",
//       dogA: "user_ghi",
//       dogB: "user_rst",
//       timestamp: "2025-05-02T16:15:00",
//       status: "Confirmed",
//       matchScore: 92,
//       dogAUser: { 
//         id: "user_ghi", 
//         name: "Cooper", 
//         breed: "German Shepherd",
//         age: 5,
//         gender: "Male",
//         owner: "Olivia Wilson",
//         phone: "+1 (555) 567-8901",
//         image: "/api/placeholder/200/200"
//       },
//       dogBUser: { 
//         id: "user_rst", 
//         name: "Lucy", 
//         breed: "Beagle",
//         age: 2,
//         gender: "Female",
//         owner: "James Taylor",
//         phone: "+1 (555) 678-9012",
//         image: "/api/placeholder/200/200"
//       }
//     },
//     {
//       id: "match004",
//       dogA: "user_jkl",
//       dogB: "user_opq",
//       timestamp: "2025-05-03T11:30:00",
//       status: "Matched",
//       matchScore: 89,
//       dogAUser: { 
//         id: "user_jkl", 
//         name: "Bailey", 
//         breed: "Siberian Husky",
//         age: 3,
//         gender: "Female",
//         owner: "Noah Martinez",
//         phone: "+1 (555) 789-0123",
//         image: "/api/placeholder/200/200"
//       },
//       dogBUser: { 
//         id: "user_opq", 
//         name: "Rocky", 
//         breed: "Boxer",
//         age: 4,
//         gender: "Male",
//         owner: "Sophia Anderson",
//         phone: "+1 (555) 890-1234",
//         image: "/api/placeholder/200/200"
//       }
//     },
//     {
//       id: "match005",
//       dogA: "user_mno",
//       dogB: "user_lmn",
//       timestamp: "2025-05-04T10:00:00",
//       status: "Pending",
//       matchScore: 84,
//       dogAUser: { 
//         id: "user_mno", 
//         name: "Milo", 
//         breed: "Shih Tzu",
//         age: 2,
//         gender: "Male",
//         owner: "Isabella Thomas",
//         phone: "+1 (555) 901-2345",
//         image: "/api/placeholder/200/200"
//       },
//       dogBUser: { 
//         id: "user_lmn", 
//         name: "Daisy", 
//         breed: "Dachshund",
//         age: 3,
//         gender: "Female",
//         owner: "Benjamin Garcia",
//         phone: "+1 (555) 012-3456",
//         image: "/api/placeholder/200/200"
//       }
//     }
//   ]);
// };

// Format date to a more readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-200";
  let textColor = "text-gray-700";
  
  if (status === "Matched") {
    bgColor = "bg-pink-100";
    textColor = "text-pink-800";
  } else if (status === "Confirmed") {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
  } else if (status === "Pending") {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-800";
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

// Match card component
const MatchCard = ({ match, showContactInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4 sm:p-6">
        {/* Match Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500">Match ID: {match.id}</span>
          <StatusBadge status={match.status} />
        </div>
        
        {/* Dogs Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Dog A */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
<img
  src={match?.dogAUser?.image || "https://www.pngmart.com/files/23/Profile-PNG-Photo.png"}
  alt={match?.dogAUser?.name || "Dog A"}
  className="w-full h-full object-cover rounded-full"
/>

              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{match.dogAUser.name}</h3>
                <p className="text-sm text-gray-600">{match.dogAUser.breed}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{match.dogAUser.gender}</span>
                </div>
                {showContactInfo && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Owner: {match.dogAUser.owner}</p>
                    <p className="text-sm font-medium text-blue-600">{match.dogAUser.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Match Icon */}
     
          {/* Dog B */}
          <div className="flex-1 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row-reverse items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
<img
  src={match?.dogBUser?.image || "https://www.pngmart.com/files/23/Profile-PNG-Photo.png"}
  alt={match?.dogBUser?.name || "Dog B"}
  className="w-full h-full object-cover rounded-full"
/>

              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{match.dogBUser.name}</h3>
                <p className="text-sm text-gray-600">{match.dogBUser.breed}</p>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-end">
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{match.dogBUser.gender}</span>
                </div>
                {showContactInfo && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Owner: {match.dogBUser.owner}</p>
                    <p className="text-sm font-medium text-blue-600">{match.dogBUser.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Match Footer */}
      
      </div>
    </div>
  );
};

export default function DogMatchesDashboard() {
    const router = useRouter();

  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatchData();
        setMatches(data);
        console.log(data)
        setFilteredMatches(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/'); // Redirect to homepage if not logged in
      }
    });

    return () => unsubscribe(); // Clean up listener
  }, [router]);
  
  useEffect(() => {
    let results = [...matches];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(match =>
        match.dogAUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogAUser.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogAUser.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      results = results.filter(match => match.status === statusFilter);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortConfig.key === 'matchScore') {
        return sortConfig.direction === 'asc' 
          ? a.matchScore - b.matchScore
          : b.matchScore - a.matchScore;
      }
      
      if (sortConfig.key === 'timestamp') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      }
      
      return 0;
    });
    
    setFilteredMatches(results);
  }, [searchTerm, statusFilter, sortConfig, matches]);
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSortConfig({ key: 'timestamp', direction: 'desc' });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">PetMatch</h1>
          <p className="text-pink-100">Find the perfect playdate for your furry friend</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Matches</p>
                <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <Heart size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
   
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Matches</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matches.filter(match => match.status === "Pending").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
       
        
        {/* Match Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} showContactInfo={showContactInfo} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter size={24} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches found</h3>
              <p className="text-gray-600">Try adjusting your search filters or clear them to see all matches.</p>
              <button
                className="mt-4 px-6 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg font-medium transition-colors"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    
    </div>
  );
}