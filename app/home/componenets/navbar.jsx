// components/PetNavbar.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, ShoppingBag, Film,Dog, Search, Menu, X, Home, Settings, Upload, HeartPlus, FilesIcon } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { ico } from '@cloudinary/url-gen/qualifiers/format';

export default function PetNavbar() {
  // Custom theme colors and fonts
  const styles = {
    fonts: {
      primary: "'Poppins', 'Nunito', 'Inter', sans-serif",
    },
    colors: {
      tealBlue: "#2D7D7A",
      softPeach: "#FDE5C0",
      mutedYellow: "#FAD688",
      softOrange: "#F5A953",
      mintGreen: "#B6DAD9",
      whiteIvory: "#F9F9F3",
      darkText: "#333333",
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar immediately when clicking a link
  const handleNavLinkClick = () => {
    setSidebarOpen(false);
  };

  // Main navigation items (4 primary ones)
  const mainNavItems = [
    { name: 'Buy', icon: <Home className="w-6 h-6" />, href: '/home' },
    { name: 'Adoption', icon: <Heart className="w-6 h-6" />, href: '/home/adoption' },
   { name: 'Pet Dating', icon: <Heart className="w-6 h-6" />, href: '/home/pet-dating' },

    { name: 'Reels', icon: <Film className="w-6 h-6" />, href: '/home/reels' },
  ];

  // Additional sidebar items
  const sideNavItems = [
   { name: 'Lost', icon: <Search className="w-6 h-6" />, href: '/home/lost' },

    { name: 'Selling', icon: <ShoppingBag className="w-6 h-6" />, href: '/home/selling' },
    { name: 'Vet Listing', icon: <Search className="w-6 h-6" />, href: '/home/vets' },
    { name: 'Upload Reels', icon: <Upload className="w-6 h-6" />, href: '/home/reels-upload' },
    { name: 'Adoption Upload Form', icon: <HeartPlus className="w-6 h-6" />, href: '/home/upload-ad' },
    { name: 'Lost Report', icon: <FilesIcon className="w-6 h-6" />, href: '/home/lost-report',
      name:'My Puppies',icon:<Dog className='w-6 h-6'/>,href:'/home/orders'
  }
     
  ];

  // Check if link is active - more precise matching
  const isActive = (href) => {
    // For the home route, only match exactly /home
    if (href === '/home') {
      return pathname === '/home';
    }
    // For other routes, match exact or child routes
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Sidebar Component (for both mobile and desktop)
  const Sidebar = () => (
    <div 
      className={`fixed top-0 right-0 z-30 h-full w-64 shadow-xl transform transition-transform duration-150 ease-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ 
        backgroundColor: styles.colors.whiteIvory,
        fontFamily: styles.fonts.primary
      }}
    >
      <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: styles.colors.mintGreen }}>
        <h2 className="text-xl font-bold" style={{ color: styles.colors.tealBlue }}>Menu</h2>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" style={{ color: styles.colors.darkText }} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="space-y-2">
          {sideNavItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-150 hover:bg-opacity-70 ${active ? 'bg-opacity-100' : 'bg-opacity-0'}`}
                style={{ 
                  fontFamily: styles.fonts.primary,
                  color: active ? styles.colors.tealBlue : styles.colors.darkText,
                  backgroundColor: active ? styles.colors.mintGreen : 'transparent',
                }}
                onClick={handleNavLinkClick}
              >
                <div style={{ color: active ? styles.colors.tealBlue : styles.colors.darkText }}>
                  {item.icon}
                </div>
                <span className={`font-medium ${active ? 'font-semibold' : ''}`}>{item.name}</span>
              </Link>
            );
          })}
    <div className="flex items-center gap-2 p-2">
      <UserButton afterSignOutUrl="/" />
      <span className="text-sm font-medium text-gray-700">Settings</span>
    </div>
        </div>
      </div>
    </div>
  );

  // Desktop Navigation (Top Bar)
  const DesktopNav = () => (
    <nav className="fixed top-0 left-0 right-0 z-20 shadow-md" style={{ 
      backgroundColor: styles.colors.whiteIvory,
      fontFamily: styles.fonts.primary
    }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <img src="/logo.png" alt="PetPals Logo" className="h-14 w-auto" />
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-12">
            {mainNavItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link 
                  key={index} 
                  href={item.href}
                  className="flex flex-col items-center transition-colors duration-150"
                  style={{ 
                    color: active ? styles.colors.tealBlue : styles.colors.darkText,
                  }}
                >
                  <div className="relative">
                    <span className={`text-sm font-medium hover:text-${styles.colors.tealBlue} ${active ? 'font-semibold' : ''}`}>
                      {item.name}
                    </span>
                    {active && (
                      <div 
                        className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full"
                        style={{ backgroundColor: styles.colors.tealBlue }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full transition-colors duration-150 hover:opacity-90"
            style={{ 
              backgroundColor: styles.colors.tealBlue,
              color: styles.colors.whiteIvory,
              fontFamily: styles.fonts.primary,
            }}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
            <span className="font-medium">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );

  // Mobile Navigation (Bottom Bar)
  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 shadow-lg border-t z-20" style={{ 
      backgroundColor: styles.colors.whiteIvory,
      borderColor: styles.colors.mintGreen,
      fontFamily: styles.fonts.primary
    }}>
      <div className="flex justify-between items-center h-16 px-6">
        {mainNavItems.map((item, index) => {
          const active = isActive(item.href);
          return (
            <Link
              key={index}
              href={item.href}
              className="flex flex-col items-center justify-center relative transition-colors duration-150"
              style={{ 
                color: active ? styles.colors.tealBlue : styles.colors.darkText,
              }}
            >
              {item.icon}
              <span className={`text-xs mt-1 ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
              {active && (
                <div 
                  className="absolute -bottom-3 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ backgroundColor: styles.colors.tealBlue }}
                />
              )}
            </Link>
          );
        })}
        
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center transition-colors duration-150"
          style={{ color: styles.colors.tealBlue }}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );

  // Overlay when sidebar is open - faster fade transition
  const Overlay = () => (
    <div 
      className={`fixed inset-0 z-20 transition-opacity duration-150 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => setSidebarOpen(false)}
      aria-hidden="true"
    />
  );

  return (
    <>
      {/* Show appropriate navbar based on screen size */}
      {!isMobile && <DesktopNav />}
      {isMobile && <MobileNav />}
      
      {/* Sidebar - shown on both mobile and desktop */}
      <Sidebar />
      
      {/* Dark overlay when sidebar is open */}
      <Overlay />
      
      {/* Content spacing - FIXED: Only add padding when needed with no extra spacing */}
      <div className={isMobile ? "pb-0" : "pt-16"} />
    </>
  );
}