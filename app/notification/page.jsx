"use client"
import { useState, useEffect } from 'react';
import { getToken } from "firebase/messaging";
import { messaging } from '../../firebase/firebase';

export default function NotificationPermissionPage() {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  
  // Check initial permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (!('Notification' in window)) {
      setError("This browser does not support notifications");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === "granted") {
        // Generate Token
        const token = await getToken(messaging, {
          vapidKey: "BGX1F5woV-7Quwi7c2vcxIDuOUsal88_UW4ygOOfHDwVMdqRAH-uCDrEBzUts1U0AN5oVJxxodtmmOSlJ4EOjvc",
        });
        
        setToken(token);
        
        // Send token to server using fetch instead of axios
        try {
          const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          
          console.log("Token Generated and sent to server:", token);
        } catch (fetchError) {
          console.error("Error sending token to server:", fetchError);
          setError(`Failed to register with server: ${fetchError.message}`);
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setError(`Error requesting permission: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Stay Updated</h1>
          <p className="text-gray-600">Enable notifications to receive updates and important alerts</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            {permissionStatus === 'granted' ? (
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            ) : (
              <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            )}
          </div>
          
          {permissionStatus === 'granted' ? (
            <div className="text-center text-green-600">
              <p className="font-medium mb-2">Notifications Enabled!</p>
              <p className="text-sm">You'll now receive important updates from our app</p>
            </div>
          ) : permissionStatus === 'denied' ? (
            <div className="text-center text-red-600">
              <p className="font-medium mb-2">Notifications Blocked</p>
              <p className="text-sm mb-4">You've denied notification permissions. To enable notifications, please update your browser settings and then refresh this page.</p>
              <div className="bg-gray-100 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-1">How to enable notifications:</p>
                <ol className="text-xs text-gray-700 list-decimal pl-4 space-y-1">
                  <li>Open your browser settings</li>
                  <li>Navigate to Site Settings or Permissions</li>
                  <li>Find Notifications settings</li>
                  <li>Allow notifications for this website</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-700 mb-4">To get real-time updates, please allow notifications when prompted.</p>
              
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {token && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 break-all">
              <span className="font-medium">Token:</span> {token.substring(0, 20)}...
            </p>
          </div>
        )}
      </div>
      
      {permissionStatus === 'granted' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Open your app</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>To complete the setup process, please open your app. Your notifications are now enabled!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}