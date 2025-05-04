"use client"
import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Activity, DollarSign, Users, Package, Clock } from 'lucide-react';
import { auth, getOrderData } from '../../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // If you're using App Router


// Simulating Firebase import and getOrderData function
// const getOrderData = () => {
//   // This would be your actual Firebase function
//   return Promise.resolve([
//     {
//       id: "order123",
//       price: "22000",
//       petId: "pet456",
//       buyerId: "buyer789",
//       sellerId: "seller101",
//       createdAt: "2025-05-01T14:30:00",
//       status: "Completed",
//       buyer: { id: "buyer789", name: "John Doe", email: "john@example.com" },
//       seller: { id: "seller101", name: "Pet Shop Inc", email: "sales@petshop.com" }
//     },
//     {
//       id: "order124",
//       price: "15000",
//       petId: "pet457",
//       buyerId: "buyer790",
//       sellerId: "seller102",
//       createdAt: "2025-05-02T10:15:00",
//       status: "Processing",
//       buyer: { id: "buyer790", name: "Jane Smith", email: "jane@example.com" },
//       seller: { id: "seller102", name: "Animal Haven", email: "info@animalhaven.com" }
//     },
//     {
//       id: "order125",
//       price: "35000",
//       petId: "pet458",
//       buyerId: "buyer791",
//       sellerId: "seller101",
//       createdAt: "2025-05-03T16:45:00",
//       status: "Pending",
//       buyer: { id: "buyer791", name: "Robert Johnson", email: "robert@example.com" },
//       seller: { id: "seller101", name: "Pet Shop Inc", email: "sales@petshop.com" }
//     },
//     {
//       id: "order126",
//       price: "18500",
//       petId: "pet459",
//       buyerId: "buyer792",
//       sellerId: "seller103",
//       createdAt: "2025-05-03T09:30:00",
//       status: "Completed",
//       buyer: { id: "buyer792", name: "Emily Davis", email: "emily@example.com" },
//       seller: { id: "seller103", name: "Paws & Claws", email: "contact@pawsclaws.com" }
//     },
//     {
//       id: "order127",
//       price: "27500",
//       petId: "pet460",
//       buyerId: "buyer793",
//       sellerId: "seller102",
//       createdAt: "2025-05-04T11:20:00",
//       status: "Processing",
//       buyer: { id: "buyer793", name: "Michael Wilson", email: "michael@example.com" },
//       seller: { id: "seller102", name: "Animal Haven", email: "info@animalhaven.com" }
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

// Format price with currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
};

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-200";
  let textColor = "text-gray-700";
  
  if (status === "Completed") {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
  } else if (status === "Processing") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-800";
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

// Card component for dashboard statistics
const StatCard = ({ icon, title, value, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-4 flex items-center`}>
      <div className="rounded-full bg-white p-3 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default function AdminOrdersDashboard() {
  
    const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  // Stats for the dashboard
  const totalSales = orders.reduce((sum, order) => sum + parseInt(order.price), 0);
  const completedOrders = orders.filter(order => order.status === "Completed").length;
  const processingOrders = orders.filter(order => order.status === "Processing").length;
  
        useEffect(() => {
         const unsubscribe = onAuthStateChanged(auth, (user) => {
           if (!user) {
             router.push('/'); // Redirect to homepage if not logged in
           }
         });
     
         return () => unsubscribe(); // Clean up listener
       }, [router]);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrderData();
        setOrders(data);
        setFilteredOrders(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order data:", error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  useEffect(() => {
    const results = orders.filter(order =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrders(results);
  }, [searchTerm, orders]);
  
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    const sortedData = [...filteredOrders].sort((a, b) => {
      if (key === 'price') {
        return direction === 'asc' 
          ? parseInt(a[key]) - parseInt(b[key])
          : parseInt(b[key]) - parseInt(a[key]);
      }
      
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredOrders(sortedData);
  };
  
  const getSortIcon = (name) => {
    if (sortConfig.key === name) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return <ChevronDown size={16} className="text-gray-300" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
     
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={<DollarSign size={24} className="text-green-600" />} 
            title="Total Sales" 
            value={formatPrice(totalSales)} 
            bgColor="bg-white"
          />
          <StatCard 
            icon={<Package size={24} className="text-blue-600" />} 
            title="Total Orders" 
            value={orders.length} 
            bgColor="bg-white"
          />
      
         
        </div>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by ID, buyer or seller name..."
                className="ml-2 outline-none flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('id')}>
                    <div className="flex items-center">
                      Order ID
                      {getSortIcon('id')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('price')}>
                    <div className="flex items-center">
                      Price
                      {getSortIcon('price')}
                    </div>
                  </th>
                
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                    <div className="flex items-center">
                      Date
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-blue-600">{order.id}</div>
                      <div className="text-xs text-gray-500">Pet ID: {order.petId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-semibold">{formatPrice(order.price)}</div>
                    </td>
       
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.buyer.name}</div>
                      <div className="text-xs text-gray-500">{order.buyer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.seller.name}</div>
                      <div className="text-xs text-gray-500">{order.seller.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No orders found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}