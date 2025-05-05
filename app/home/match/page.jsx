"use client"
import { useState, useEffect } from 'react';
import { Search, Heart, Filter, X, MessageCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getMatchData } from '../../../firebase/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";

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
const options = { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: 'numeric', 
  minute: 'numeric', 
  second: 'numeric', 
  timeZoneName: 'short'
};

// Create a Date object using the timestamp (no need for string manipulation)
const date = new Date(match.timestamp);

// Format it for display in IST (Indian Standard Time)
const istDate = date.toLocaleString('en-IN', options);


  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4 sm:p-6">
        {/* Match Header */}
      
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
          <div className="flex flex-col items-center">
            <div className="p-2 bg-pink-100 rounded-full">
              <Heart size={24} className="text-pink-600" />
            </div>
          </div>
          
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
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-end">
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
        

      </div>
    </div>
  );
};

export default function MyMatchesDashboard() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [filterOpen, setFilterOpen] = useState(false);
  
  const { userId, isSignedIn } = useAuth();

  // Fetch match data
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const allMatches = await getMatchData();
        
        // Filter matches to only show those where the current user is involved
        console.log(allMatches)
        console.log(userId)
        const userMatches = allMatches.filter(match => 

          match.dogA === userId || match.dogB === userId
        );
        console.log(userMatches)
        
        setMatches(userMatches);
        setFilteredMatches(userMatches);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [userId]);
  
  // Apply filters and sorting
  useEffect(() => {
    let results = [...matches];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(match =>
        match.dogAUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogAUser.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogAUser.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.dogBUser.owner?.toLowerCase().includes(searchTerm.toLowerCase())
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
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }
  
  // No matches found state
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Filter size={36} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No matches found</h2>
          <p className="text-gray-600">You don't have any matches yet. Keep swiping to find new playdate partners!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">My Matches</h1>
          <p className="text-pink-100">See all your potential playdates</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Matches</p>
                <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-full">
                <Heart size={24} className="text-pink-600" />
              </div>
            </div>
          </div>
          
         
       
   </div>
        
        {/* Match Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} showContactInfo={showContactInfo} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
             
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches found</h3>
              <p className="text-gray-600">Try adjusting your search filters or clear them to see all your matches.</p>
             
            </div>
          )}
        </div>
      </div>
    </div>
  );
}