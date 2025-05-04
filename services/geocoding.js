/**
 * Service for handling geocoding operations
 */

/**
 * Reverse geocode coordinates to get a human-readable address
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<string>} - A human-readable location string
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Use environment variable rather than hardcoding the API key
  
    
   
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=ba268a0b83f441f7be78a6b8796366bc&language=en&pretty=1`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.status?.message || 'Unknown error'}`);
    }
    
    if (data.results && data.results.length > 0) {
      // Extract city/town and country
      const result = data.results[0];
      const components = result.components;
      
      // Try to get the most specific locality name
      const locality = components.city || 
                      components.town || 
                      components.village || 
                      components.suburb ||
                      components.county || 
                      '';
                      
      const state = components.state || components.region || '';
      const country = components.country || '';
      
      // Create a formatted location name
      if (locality && country) {
        if (state && state !== locality) {
          return `${locality}, ${state}, ${country}`;
        }
        return `${locality}, ${country}`;
      }
      
      // Fall back to the formatted address provided by the API
      return result.formatted;
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<{latitude: number, longitude: number}>} - Coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    // Use environment variable rather than hardcoding the API key
    const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenCage API key is not configured. Please set NEXT_PUBLIC_OPENCAGE_API_KEY environment variable');
    }
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=ba268a0b83f441f7be78a6b8796366bc&language=en&pretty=1`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.status?.message || 'Unknown error'}`);
    }
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry;
      
      return {
        latitude: lat,
        longitude: lng
      };
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Alternative implementation using Google Maps Geocoding API
 * Note: Requires Google Maps API key with Geocoding API enabled
 */
export const googleReverseGeocode = async (latitude, longitude) => {
  try {
    // Use environment variable rather than hardcoding the API key
    const apiKey = ba268a0b83f441f7be78a6b8796366bc
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable');
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=ba268a0b83f441f7be78a6b8796366bc`
    );
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status || 'Unknown error'}`);
    }
    
    if (data.results && data.results.length > 0) {
      // Find locality and country from address components
      const result = data.results[0];
      
      // For a simple location name, use the locality result type
      const localityResult = data.results.find(result => 
        result.types.includes('locality') || 
        result.types.includes('postal_town')
      );
      
      if (localityResult) {
        return localityResult.formatted_address;
      }
      
      // Fall back to the first result
      return result.formatted_address;
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Google reverse geocoding error:', error);
    throw error;
  }
};