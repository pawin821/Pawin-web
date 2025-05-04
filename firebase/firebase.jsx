// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, addDoc ,setDoc,getDoc,collection,query,orderBy,getDocs,serverTimestamp,limit,updateDoc,arrayUnion,increment,arrayRemove,where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getMessaging } from "firebase/messaging";
import axios from "axios";


function generateRandomHex(bytes = 32) {
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

const firebaseConfig = {
  apiKey: "AIzaSyCv3l7nY7fqzAead9ue8Wm6Mc50WhDglgo",
  authDomain: "pawin-6b84a.firebaseapp.com",
  projectId: "pawin-6b84a",
  storageBucket: "pawin-6b84a.firebasestorage.app",
  messagingSenderId: "927720563589",
  appId: "1:927720563589:web:bafc3a4c1bc0ffd3a19aec",
  measurementId: "G-567W0W3YVG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export const messaging = getMessaging(app);
/**
 * Save user data to Firestore - documents are already uploaded via Cloudinary
 * @param {Object} userData - The user data to save with document URLs included
 * @returns {Promise<string>} - The ID of the created user document
 * 
 * 
 */



export const saveLostReport = async (reportId, reportData) => {
  try {
    const reportToSave = { ...reportData, id: reportId };

    // Add timestamp
    reportToSave.createdAt = new Date().toISOString();

    // Add location data if available
    if (reportData.location) {
      reportToSave.location = reportData.location;
    }

    const reportRef = doc(db, 'lostReports', reportId);
    await setDoc(reportRef, reportToSave);

    return reportId;
  } catch (error) {
    console.error('Error saving lost report:', error);
    throw error;
  }
};
export const savePetDatingProfile = async (profileId, profileData) => {
  try {
    const profileToSave = { ...profileData, id: profileId };

    // Add timestamp
    profileToSave.createdAt = new Date().toISOString();

    // Add location if provided
    if (profileData.location) {
      profileToSave.location = profileData.location;
    }

    const profileRef = doc(db, 'petDatingProfiles', profileId);
    await setDoc(profileRef, profileToSave);

    return profileId;
  } catch (error) {
    console.error('Error saving pet dating profile:', error);
    throw error;
  }
};
export const getAllPetDatingProfiles = async (currentUserId) => {
  try {
    // Step 1: Get the current user's profile to extract their breed and location
    const profilesCollectionRef = collection(db, 'petDatingProfiles');
    
    console.log('Searching for profiles for user ID:', currentUserId);
    
    const userProfileQuerySnapshot = await getDocs(
      query(profilesCollectionRef, where('userId', '==', currentUserId))
    );
    
    console.log('Found user profile docs:', userProfileQuerySnapshot.size);
    
    if (userProfileQuerySnapshot.empty) {
      throw new Error('Current user profile not found');
    }
    
    const currentUserData = userProfileQuerySnapshot.docs[0].data();
    const currentBreed = currentUserData.breed;
    const currentLocation = currentUserData.location || '';
    
    console.log('Current user breed:', currentBreed);
    console.log('Current user location:', currentLocation);
    
    // Step 2: Get all profiles
    const allProfilesSnapshot = await getDocs(profilesCollectionRef);
    
    console.log('Total profiles found:', allProfilesSnapshot.size);
    
    // Step 3: Map and filter out the current user
    const allProfiles = allProfilesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          petName: data.petName || '',
          breed: data.breed || '',
          gender: data.gender || '',
          age: data.age || '',
          personality: data.personality || '',
          likes: data.likes || '',
          dislikes: data.dislikes || '',
          location: data.location || '',
          userId: data.userId || '',
          mediaFiles: data.mediaFiles || [],
          createdAt: data.createdAt || new Date().toISOString()
        };
      })
      .filter(profile => profile.userId !== currentUserId);
    
    console.log('Profiles after filtering current user:', allProfiles.length);
    
    // Step 4: Calculate string similarity for location and separate into matching and non-matching profiles
    const matchingProfiles = [];
    const nonMatchingProfiles = [];
    
    // Helper function to calculate string similarity using Levenshtein distance
    const calculateStringSimilarity = (str1, str2) => {
      if (!str1 || !str2) return 0;
      
      // Convert both strings to lowercase for case-insensitive comparison
      const s1 = str1.toLowerCase();
      const s2 = str2.toLowerCase();
      
      // If strings are identical, similarity is 100%
      if (s1 === s2) return 1;
      
      // Calculate Levenshtein distance
      const len1 = s1.length;
      const len2 = s2.length;
      
      // Create distance matrix
      const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
      
      // Initialize first row and column
      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;
      
      // Fill matrix
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }
      
      // Calculate similarity as 1 - normalized distance
      const maxLen = Math.max(len1, len2);
      if (maxLen === 0) return 1; // Both strings empty
      
      return 1 - (matrix[len1][len2] / maxLen);
    };
    
    // Process each profile for location similarity
    allProfiles.forEach(profile => {
      // Calculate location similarity
      const locationSimilarity = calculateStringSimilarity(currentLocation, profile.location);
      console.log(`Location similarity for ${profile.petName}: ${(locationSimilarity * 100).toFixed(2)}%`);
      
      // Add similarity score to profile
      profile.locationSimilarity = locationSimilarity;
      
      // Separate profiles based on 80% similarity threshold
      if (locationSimilarity >= 0.8) {
        matchingProfiles.push(profile);
      } else {
        nonMatchingProfiles.push(profile);
      }
    });
    
    console.log('Profiles with location similarity ≥ 80%:', matchingProfiles.length);
    console.log('Profiles with location similarity < 80%:', nonMatchingProfiles.length);
    
    // Step 5: Prioritize showing matching breed profiles
    const sortProfiles = (profiles) => {
      return profiles.sort((a, b) => {
        // First sort by breed match
        const aBreedMatch = a.breed === currentBreed ? 1 : 0;
        const bBreedMatch = b.breed === currentBreed ? 1 : 0;
        
        if (aBreedMatch !== bBreedMatch) {
          return bBreedMatch - aBreedMatch; // Profiles with matching breed come first
        }
        
        // If breed match is the same, sort by location similarity (higher first)
        return b.locationSimilarity - a.locationSimilarity;
      });
    };
    
    // Sort both result sets
    const sortedMatchingProfiles = sortProfiles(matchingProfiles);
    const sortedNonMatchingProfiles = sortProfiles(nonMatchingProfiles);
    
    // Helper function to shuffle an array (Fisher-Yates algorithm)
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    // Randomize order within each group
    const randomizedMatchingProfiles = shuffleArray([...sortedMatchingProfiles]);
    const randomizedNonMatchingProfiles = shuffleArray([...sortedNonMatchingProfiles]);
    
    console.log(`Returning ${randomizedMatchingProfiles.length + randomizedNonMatchingProfiles.length} total profiles (${randomizedMatchingProfiles.length} matching, ${randomizedNonMatchingProfiles.length} non-matching)`);
    
    // Return all profiles in the correct order: matching profiles first (randomized), then non-matching profiles (randomized)
    return [...randomizedMatchingProfiles, ...randomizedNonMatchingProfiles];
  } catch (error) {
    console.error('Error getting filtered pet dating profiles:', error);
    throw error;
  }
};

export const saveUserData = async (userId,userData) => {


  try {
      

    
    // Create a copy of the user data to avoid modifying the original
    const userDataToSave = { ...userData, id: userId };
    
    // Add timestamp
    userDataToSave.createdAt = new Date().toISOString();
    
    // Add location data if available
    if (userData.location) {
      userDataToSave.location = userData.location;
    }
    
    // Save to Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, userDataToSave);
    
    return userId;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}
export const checkUserBadge = async (userId) => {
  try {
    console.log("hello")
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(userData.badge)
      return userData.badge === "1";
    } else {
      console.warn('No user found with the given ID.');
      return false;
    }
  } catch (error) {
    console.error('Error checking user badge:', error);
    throw error;
  }
}
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    0.5 - Math.cos(dLat) / 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    (1 - Math.cos(dLon)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

const getClientLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => reject(error)
    );
  });
};

export const getAllVets = async () => {
  try {
    const clientLocation = await getClientLocation();

    const usersRef = collection(db, 'users');
    const vetsQuery = query(
      usersRef,
      where('userType', '==', 'vet'),
      where('badge', '==', '1') // Added badge check here
    );
    const querySnapshot = await getDocs(vetsQuery);

    const vets = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const distance = getDistanceFromLatLonInKm(
        clientLocation.latitude,
        clientLocation.longitude,
        data.latitude,
        data.longitude
      );
      return {
        id: doc.id,
        ...data,
        distance
      };
    });

    // Sort by distance
    vets.sort((a, b) => a.distance - b.distance);

    // Top 30 within 100km
    const within100km = vets.filter((v) => v.distance <= 100).slice(0, 30);

    // Rest are outside radius
    const outside100km = vets.filter((v) => v.distance > 100);

    // Combine
    return [...within100km, ...outside100km];
  } catch (error) {
    console.error('Error getting vets:', error);
    throw error;
  }
};

export const savePetData = async (petData) => {
  const cid = generateRandomHex();
  try {
    // Create a copy of the pet data to avoid modifying the original
    const petDataToSave = { ...petData, id: cid };

    // Add timestamp
    petDataToSave.createdAt = new Date().toISOString();

    // Add location data if available
    if (petData.location) {
      petDataToSave.location = petData.location;
    }

    // Save to Firestore - Fix: add the cid as the document ID
    const petRef = doc(db, 'pets', cid);
    await setDoc(petRef, petDataToSave);

    return cid; // Return the ID of the new pet document
  } catch (error) {
    console.error('Error saving pet data:', error);
    throw error;
  }
};
export const saveOrder = async (orderData) => {
  const orderId = generateRandomHex();

  try {
    // Create a copy of the order data and attach order ID
    const orderDataToSave = { ...orderData, id: orderId };

    // Add creation timestamp
    orderDataToSave.createdAt = new Date().toISOString();

    // Add location if available
    if (orderData.location) {
      orderDataToSave.location = orderData.location;
    }

    // Save to Firestore with the orderId as the document ID
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, orderDataToSave);

    return orderId; // Return the ID of the saved order
  } catch (error) {
    console.error('Error saving order data:', error);
    throw error;
  }
};

/**
 * Retrieves pet data from Firestore
 * @param {string} petId - The ID of the pet to retrieve (optional)
 * @param {Object} filters - Optional filters to apply (optional)
 * @returns {Promise<Object|Array>} - The pet data or array of pets
 */
export const getPetData = async (petId = null, filters = null) => {
  try {
    if (petId) {
      const petRef = doc(db, 'pets', petId);
      const petSnap = await getDoc(petRef);

      if (petSnap.exists()) {
        console.log('Pet found:', petSnap.id, petSnap.data());
        return { id: petSnap.id, ...petSnap.data() };
      } else {
        console.log('No pet found with that ID');
        return null;
      }
    }

    const petsRef = collection(db, 'pets');
    const queryConstraints = [];

    // Apply filters if provided
    if (filters) {
      console.log('Filters:', filters);

      if (filters.userId) {
        queryConstraints.push(where('userId', '==', filters.userId));
        console.log('Filter by userId:', filters.userId);
      }

      if (filters.breed) {
        queryConstraints.push(where('breed', '==', filters.breed));
        console.log('Filter by breed:', filters.breed);
      }

      if (filters.gender) {
        queryConstraints.push(where('gender', '==', filters.gender));
        console.log('Filter by gender:', filters.gender);
      }

      if (filters.minCost) {
        queryConstraints.push(where('cost', '>=', filters.minCost));
        console.log('Filter by minCost:', filters.minCost);
      }

      if (filters.maxCost) {
        queryConstraints.push(where('cost', '<=', filters.maxCost));
        console.log('Filter by maxCost:', filters.maxCost);
      }

      // Optional: sort by date unless disabled
      if (filters.sortByDate !== false) {
        queryConstraints.push(orderBy('createdAt', 'desc'));
        console.log('Sorting by createdAt');
      }

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
        console.log('Limiting results to:', filters.limit);
      }
    }

    const petsQuery = query(petsRef, ...queryConstraints);
    console.log('Final pets query:', petsQuery);

    const querySnapshot = await getDocs(petsQuery);
    console.log('Fetched pets:', querySnapshot.size);

    // Get client location
    const clientLocation = await getClientLocation();
    console.log('Client location (latitude, longitude):', clientLocation);

    // Calculate distances and attach to pet data
    const petsWithDistance = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const petLatitude = data.latitude;
      const petLongitude = data.longitude;
      const petName = data.name; // Assuming the pet name is stored in the 'name' field in the database

      // Calculate the distance
      const distance = getDistanceFromLatLonInKm(
        clientLocation.latitude,
        clientLocation.longitude,
        petLatitude,
        petLongitude
      );

      // Log client and pet coordinates, and the distance
      console.log(`
        Client Latitude: ${clientLocation.latitude}, Longitude: ${clientLocation.longitude}
        Pet Name: ${petName}, Latitude: ${petLatitude}, Longitude: ${petLongitude}
        Distance from client: ${distance} km
      `);

      return {
        id: doc.id,
        ...data,
        distance,
      };
    });

    // Separate within and outside 100km
    const within100km = petsWithDistance
      .filter((p) => p.distance <= 100)
      .sort((a, b) => a.distance - b.distance);
    console.log('Pets within 100km:', within100km);

    const outside100km = petsWithDistance
      .filter((p) => p.distance > 100)
      .sort((a, b) => a.distance - b.distance);
    console.log('Pets outside 100km:', outside100km);
const result =
  within100km.length > 30 ? [...within100km] : [...within100km, ...outside100km];

    return result;
  } catch (error) {
    console.error('Error getting pet data:', error);
    throw error;
  }
};


// export const saveVideoData = async (videoData, userId) => {
//   const vid = generateRandomHex(); // Unique video ID

//   try {
//     const videoDataToSave = {
//       ...videoData,
//       id: vid,
//       userId: userId,
//       createdAt: new Date().toISOString(),
//     };

//     // Include location if provided
//     if (videoData.location) {
//       videoDataToSave.location = videoData.location;
//     }

//     // Save to Firestore under 'shortVideos' collection
//     const videoRef = doc(db, "shortVideos", vid);
//     await setDoc(videoRef, videoDataToSave);

//     return vid;
//   } catch (error) {
//     console.error("Error saving video data:", error);
//     throw error;
//   }
// };
// export const getUserVideos = async (userId) => {
//   try {
//     let videosQuery;

//     if (userId) {
//       videosQuery = query(
//         collection(db, "shortVideos"),
//         where("userId", "==", userId)
//       );
//     } else {
//       videosQuery = query(collection(db, "shortVideos")); // no filter
//     }

//     const querySnapshot = await getDocs(videosQuery);

//     const videos = querySnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return videos;
//   } catch (error) {
//     console.error("Error retrieving videos:", error);
//     throw error;
//   }
// };
export const saveAdaptionData = async (adaptionData, userId) => {
  const adaptionId = generateRandomHex(); // Unique adaption ID

  try {
    const adaptionDataToSave = {
      ...adaptionData,
      id: adaptionId,
      userId: userId,
      createdAt: serverTimestamp(),
      views: 0,
      likes: [],
      likeCount: 0,
      commentCount: 0
    };

    // Include location if provided
    if (adaptionData.location) {
      adaptionDataToSave.location = adaptionData.location;
    }

    // Save to Firestore under 'adaptions' collection
    const adaptionRef = doc(db, "adaptions", adaptionId);
    await setDoc(adaptionRef, adaptionDataToSave);

    return adaptionId;
  } catch (error) {
    console.error("Error saving adaption data:", error);
    throw error;
  }
};


export const saveVideoData = async (videoData, userId) => {
  const vid = generateRandomHex(); // Unique video ID

  try {
    const videoDataToSave = {
      ...videoData,
      id: vid,
      userId: userId,
      createdAt: serverTimestamp(),
      views: 0,
      likes: [],
      likeCount: 0,
      commentCount: 0
    };

    // Include location if provided
    if (videoData.location) {
      videoDataToSave.location = videoData.location;
    }

    // Save to Firestore under 'shortVideos' collection
    const videoRef = doc(db, "shortVideos", vid);
    await setDoc(videoRef, videoDataToSave);

    return vid;
  } catch (error) {
    console.error("Error saving video data:", error);
    throw error;
  }
};

/**
 * Fetches videos by user ID
 * @param {string} userId - The user ID to fetch videos for
 * @param {number} limitCount - Optional limit on number of videos to fetch
 * @returns {Promise<Array>} - Array of video objects
 */


/**
 * Fetches feed videos (could be personalized, trending, etc.)
 * @param {number} limitCount - Optional limit on number of videos to fetch
 * @returns {Promise<Array>} - Array of video objects
 */


/**
 * Adds a comment to a video
 * @param {string} videoId - The video ID
 * @param {Object} commentData - The comment data (text, userId, etc.)
 * @returns {Promise<string>} - The generated comment ID
 */


/**
 * Toggles a like on a video (adds or removes based on current state)
 * @param {string} videoId - The video ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - True if liked, false if unliked
 */


/**
 * Checks if a user has liked a video
 * @param {string} videoId - The video ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - True if user has liked the video
 */


/**
 * Gets a single video by ID
 * @param {string} videoId - The video ID
 * @returns {Promise<Object|null>} - Video object or null if not found
 */


export const getUserVideos = async (userId = null, limitCount = 20) => {
  try {
    let videosQuery;
    
    if (userId) {
      // Query videos by userId, ordered by creation date
      videosQuery = query(
        collection(db, "shortVideos"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      // If no userId provided, get all videos ordered by creation date
      videosQuery = query(
        collection(db, "shortVideos"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const videosSnapshot = await getDocs(videosQuery);
    
    // Map documents to objects with their data
    const videos = videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    return videos;
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }
};

/**
 * Fetches feed videos (could be personalized, trending, etc.)
 * @param {number} limitCount - Optional limit on number of videos to fetch
 * @returns {Promise<Array>} - Array of video objects
 */
export const getFeedVideos = async (limitCount = 10) => {
  try {
    // For a simple implementation, just get recent videos
    // In a real app, you might have more complex logic for feed generation
    const videosQuery = query(
      collection(db, "shortVideos"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const videosSnapshot = await getDocs(videosQuery);
    
    const videos = videosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    return videos;
  } catch (error) {
    console.error("Error fetching feed videos:", error);
    throw error;
  }
};

/**
 * Adds a comment to a video
 * @param {string} videoId - The video ID
 * @param {Object} commentData - The comment data (text, userId, etc.)
 * @returns {Promise<string>} - The generated comment ID
 */
const getUsernameByUserId = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.name || "Anonymous";
    } else {
      console.warn("No such user found");
      return "Anonymous";
    }
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Anonymous";
  }
};

// Main addComment function
export const addComment = async (videoId, commentData, userId, user) => {
  try {
    const commentId = generateRandomHex();
    const videoRef = doc(db, "shortVideos", videoId);

    // Check if video exists
    const videoDoc = await getDoc(videoRef);
    if (!videoDoc.exists()) {
      throw new Error("Video not found");
    }

    // Fetch name from users collection using userId
    const nameFromDB = await getUsernameByUserId(userId);

    // Create comment object
    const comment = {
      id: commentId,
      userId: userId,
      displayName: nameFromDB,
      photoURL: user?.profile_image_url || null,
      text: commentData.text,
      createdAt: serverTimestamp()
    };

    // Save comment
    const commentRef = doc(db, "shortVideos", videoId, "comments", commentId);
    await setDoc(commentRef, comment);

    // Increment comment count
    await updateDoc(videoRef, {
      commentCount: increment(1)
    });

    return commentId;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Fetches comments for a specific video
 * @param {string} videoId - The video ID
 * @param {number} limitCount - Optional limit on number of comments to fetch
 * @returns {Promise<Array>} - Array of comment objects
 */
export const getVideoComments = async (videoId, limitCount = 50) => {
  try {
    const commentsQuery = query(
      collection(db, "shortVideos", videoId, "comments"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    
    const comments = commentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    return comments;
  } catch (error) {
    console.error("Error fetching video comments:", error);
    throw error;
  }
};

/**
 * Toggles a like on a video (adds or removes based on current state)
 * @param {string} videoId - The video ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - True if liked, false if unliked
 */
export const likeVideo = async (videoId, userId = null) => {
  // Check if user is authenticated

  
  // Use provided userId or fall back to currentUser.uid
  const actualUserId = userId 
  
  try {
    const videoRef = doc(db, "shortVideos", videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      throw new Error("Video not found");
    }
    
    const videoData = videoDoc.data();
    const likes = videoData.likes || [];
    const isLiked = likes.includes(actualUserId);
    
    if (isLiked) {
      // User already liked the video, so unlike it
      await updateDoc(videoRef, {
        likes: arrayRemove(actualUserId),
        likeCount: increment(-1)
      });
      console.log(false)
      return false; // Returned unliked status
    } else {
      // User hasn't liked the video, so like it
      await updateDoc(videoRef, {
        likes: arrayUnion(actualUserId),
        likeCount: increment(1)
      });
      console.log(true)
      return true; // Returned liked status
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

/**
 * Checks if a user has liked a video
 * @param {string} videoId - The video ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - True if user has liked the video
 */
export const hasUserLikedVideo = async (videoId, userId) => {
  // Use provided userId or current user

  
  try {
    const videoRef = doc(db, "shortVideos", videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      throw new Error("Video not found");
    }
    
    const videoData = videoDoc.data();
    const likes = videoData.likes || [];
    console.log(likes)
    console.log(userId)
    return likes.includes(userId);
  } catch (error) {
    console.error("Error checking if user liked video:", error);
    return false;
  }
};

/**
 * Increments the view count for a video
 * @param {string} videoId - The video ID
 * @returns {Promise<void>}
 */
export const incrementVideoView = async (videoId) => {
  try {
    const videoRef = doc(db, "shortVideos", videoId);
    
    // Check if video exists
    const videoDoc = await getDoc(videoRef);
    if (!videoDoc.exists()) {
      throw new Error("Video not found");
    }
    
    // Increment view count
    await updateDoc(videoRef, {
      views: increment(1)
    });
    
    // If you want to track unique views, you might also store user-video pairs
    // in a separate collection, but that would require authentication
  } catch (error) {
    console.error("Error incrementing view count:", error);
    throw error;
  }
};

/**
 * Gets a single video by ID
 * @param {string} videoId - The video ID
 * @returns {Promise<Object|null>} - Video object or null if not found
 */
export const getVideoById = async (videoId) => {
  try {
    const videoRef = doc(db, "shortVideos", videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return null;
    }
    
    return {
      ...videoDoc.data(),
      id: videoDoc.id
    };
  } catch (error) {
    console.error("Error fetching video:", error);
    throw error;
  }
};


/**
 * Get current user ID
 * @returns {string|null} - User ID or null if not authenticated
 */
export const getCurrentUserId = () => {
  return auth.currentUser ? auth.currentUser.uid : null;
};
export const getAdoptionData = async () => {
  try {
    const adoptionRef = collection(db, "adoptions");
    const q = query(adoptionRef, orderBy("createdAt", "desc")); // sort by newest
    const snapshot = await getDocs(q);

    const adoptionList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return adoptionList;
  } catch (error) {
    console.error("Error getting adoption data:", error);
    throw error;
  }
};
export const getAdaptionData = async (adaptionId = null, filters = null) => {
  try {
    if (adaptionId) {
      const adaptionRef = doc(db, 'adaptions', adaptionId);
      const adaptionSnap = await getDoc(adaptionRef);

      if (adaptionSnap.exists()) {
        return { id: adaptionSnap.id, ...adaptionSnap.data() };
      } else {
        console.log('No adaption found with that ID');
        return null;
      }
    }

    let adaptionsRef = collection(db, 'adaptions');
    const queryConstraints = [];

    if (filters) {
      if (filters.userId) {
        queryConstraints.push(where('userId', '==', filters.userId));
        console.log('Filter: userId =', filters.userId);
      }

      if (filters.petType) {
        queryConstraints.push(where('petType', '==', filters.petType));
        console.log('Filter: petType =', filters.petType);
      }

      if (filters.location) {
        queryConstraints.push(where('location', '==', filters.location));
        console.log('Filter: location =', filters.location);
      }

      if (filters.minViews) {
        queryConstraints.push(where('views', '>=', filters.minViews));
        console.log('Filter: minViews >=', filters.minViews);
      }

      if (filters.minLikes) {
        queryConstraints.push(where('likeCount', '>=', filters.minLikes));
        console.log('Filter: minLikes >=', filters.minLikes);
      }

      if (filters.sortByDate !== false) {
        queryConstraints.push(orderBy('createdAt', 'desc'));
        console.log('Sorting by createdAt');
      }

      if (filters.sortByViews) {
        queryConstraints.push(orderBy('views', 'desc'));
        console.log('Sorting by views');
      }

      if (filters.sortByLikes) {
        queryConstraints.push(orderBy('likeCount', 'desc'));
        console.log('Sorting by likeCount');
      }

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
        console.log('Limiting to:', filters.limit);
      }
    }

    const adaptionsQuery = query(adaptionsRef, ...queryConstraints);
    const querySnapshot = await getDocs(adaptionsQuery);

    const clientLocation = await getClientLocation();
    console.log('Client location: ', clientLocation);

    const adaptionsWithDistance = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const adaptionLatitude = data.latitude;
      const adaptionLongitude = data.longitude;
      const title = data.title || 'Untitled';

      const distance = getDistanceFromLatLonInKm(
        clientLocation.latitude,
        clientLocation.longitude,
        adaptionLatitude,
        adaptionLongitude
      );

      console.log(`
        Client Latitude: ${clientLocation.latitude}, Longitude: ${clientLocation.longitude}
        Adaption Title: ${title}, Latitude: ${adaptionLatitude}, Longitude: ${adaptionLongitude}
        Distance from client: ${distance} km
      `);

      return {
        id: doc.id,
        ...data,
        distance,
      };
    });

    const within100km = adaptionsWithDistance
      .filter((a) => a.distance <= 100)
      .sort((a, b) => a.distance - b.distance);
    console.log('Adaptions within 100km:', within100km);

    const outside100km = adaptionsWithDistance
      .filter((a) => a.distance > 100)
      .sort((a, b) => a.distance - b.distance);
    console.log('Adaptions outside 100km:', outside100km);

    return [...within100km, ...outside100km];
  } catch (error) {
    console.error('Error getting adaption data:', error);
    throw error;
  }
};

export const getLostReportData = async (reportId = null, filters = null) => {
  try {
    if (reportId) {
      const reportRef = doc(db, 'lostReports', reportId);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        return { id: reportSnap.id, ...reportSnap.data() };
      } else {
        console.log('No lost report found with that ID');
        return null;
      }
    }

    let reportsRef = collection(db, 'lostReports');
    const queryConstraints = [];

    if (filters) {
      if (filters.userId) {
        queryConstraints.push(where('userId', '==', filters.userId));
        console.log('Filter: userId =', filters.userId);
      }

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
        console.log('Filter: status =', filters.status);
      }

      if (filters.location) {
        queryConstraints.push(where('location', '==', filters.location));
        console.log('Filter: location =', filters.location);
      }

      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type));
        console.log('Filter: type =', filters.type);
      }

      if (filters.sortByDate !== false) {
        queryConstraints.push(orderBy('createdAt', 'desc'));
        console.log('Sorting by createdAt');
      }

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit));
        console.log('Limiting to:', filters.limit);
      }
    }

    const reportsQuery = query(reportsRef, ...queryConstraints);
    const querySnapshot = await getDocs(reportsQuery);

    const clientLocation = await getClientLocation();
    console.log('Client location:', clientLocation);

    const reportsWithDistance = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const reportLat = data.latitude;
      const reportLon = data.longitude;
      const title = data.title || 'Untitled Report';

      const distance = getDistanceFromLatLonInKm(
        clientLocation.latitude,
        clientLocation.longitude,
        reportLat,
        reportLon
      );

      console.log(`
        Client Latitude: ${clientLocation.latitude}, Longitude: ${clientLocation.longitude}
        Report Title: ${title}, Latitude: ${reportLat}, Longitude: ${reportLon}
        Distance from client: ${distance} km
      `);

      return {
        id: doc.id,
        ...data,
        distance,
      };
    });

    const within100km = reportsWithDistance
      .filter((r) => r.distance <= 100)
      .sort((a, b) => a.distance - b.distance);

    const outside100km = reportsWithDistance
      .filter((r) => r.distance > 100)
      .sort((a, b) => a.distance - b.distance);

    console.log('Lost reports within 100km:', within100km);
    console.log('Lost reports outside 100km:', outside100km);

    return [...within100km, ...outside100km];
  } catch (error) {
    console.error('Error getting lost report data:', error);
    throw error;
  }
};
export const likeDog = async (fromDogId, toDogId) => {
  try {
    // Save the like
    await addDoc(collection(db, 'likes'), {
      from: fromDogId,
      to: toDogId,
      timestamp: serverTimestamp(),
    });

    // Check if the other dog already liked this one
    const reverseLikeQuery = query(
      collection(db, 'likes'),
      where('from', '==', toDogId),
      where('to', '==', fromDogId)
    );

    const reverseLikeSnapshot = await getDocs(reverseLikeQuery);

    if (!reverseLikeSnapshot.empty) {
      // They like each other => match!
      await addDoc(collection(db, 'matches'), {
        dogA: fromDogId,
        dogB: toDogId,
        timestamp: serverTimestamp(),
      });

      console.log(`🎉 Match found between ${fromDogId} and ${toDogId}`);
      return true;
    } else {
      console.log(`👍 ${fromDogId} liked ${toDogId}, waiting for mutual`);
      return false;
    }
  } catch (error) {
    console.error("Error processing like:", error);
    throw error;
  }
};

export const getUserData = async (userId = null, filters = null) => {
  console.log("yes")
  try {
    if (userId) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log('User found:', userSnap.id, userSnap.data());
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        console.log('No user found with that ID');
        return null;
      }
    }

    const usersCollectionRef = collection(db, 'users');

    let q = usersCollectionRef;
  

    // Optional filtering logic
    // if (filters && typeof filters === 'object') {
    //   const conditions = Object.entries(filters).map(([key, value]) =>
    //     where(key, '==', value)
    //   );
    //   if (conditions.length) {
    //     q = query(usersCollectionRef, ...conditions);
    //   }
    // }

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(users)
    
    return users;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return [];
  }
};
export const updateBadge = async (userId, badgeValue = "1") => {
  try {
    if (!userId) {
      console.log('User ID is required');
      return;
    }

    const userRef = doc(db, 'users', userId);

    // Update the badge field to the provided value (default is 1)
    await updateDoc(userRef, {
      badge: badgeValue,
    });

    console.log(`User with ID ${userId} updated successfully with badge ${badgeValue}`);
  } catch (error) {
    console.error('Error updating user badge:', error);
  }
};
export const auth = getAuth(app);
const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
  } catch (err) {
    console.error(`Error fetching user ${userId}:`, err);
    return null;
  }
};

export const getOrderData = async (orderId = null, filters = null) => {
  console.log("Fetching order data");

  try {
    const enrichOrder = async (order) => {
      const buyer = await getUserById(order.buyerId);
      const seller = await getUserById(order.sellerId);
      return {
        ...order,
        buyer,
        seller
      };
    };

    // Case 1: Get specific order
    if (orderId) {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        console.log('No order found with that ID');
        return null;
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };
      return await enrichOrder(orderData);
    }

    // Case 2: Get all orders (optionally with filters)
    let ordersQuery = collection(db, 'orders');
    if (filters) {
      for (const key in filters) {
        ordersQuery = query(ordersQuery, where(key, '==', filters[key]));
      }
    }

    const ordersSnap = await getDocs(ordersQuery);
    const orders = await Promise.all(
      ordersSnap.docs.map(async (docSnap) => {
        const orderData = { id: docSnap.id, ...docSnap.data() };
        return await enrichOrder(orderData);
      })
    );

    return orders;

  } catch (error) {
    console.error("Error fetching order data:", error);
    return null;
  }
};
export const getMatchData = async (filters = null) => {
  console.log("Fetching all matches");

  try {
    let matchesQuery = collection(db, 'matches');

    if (filters) {
      for (const key in filters) {
        matchesQuery = query(matchesQuery, where(key, '==', filters[key]));
      }
    }

    const matchesSnap = await getDocs(matchesQuery);
    

    const matches = await Promise.all(
      matchesSnap.docs.map(async (docSnap) => {
        const match = { id: docSnap.id, ...docSnap.data() };

        const dogAUser = await getUserById(match.dogA);
        const dogBUser = await getUserById(match.dogB);
        

        return {
          ...match,
          dogAUser,
          dogBUser
        };
      })
    );

    return matches;

  } catch (error) {
    console.error("Error fetching matches:", error);
    return null;
  }
};
export const fetchPetsByBuyer = async (currentUserId) => {
  try {
    // Step 1: Query orders where buyerId == currentUserId
    const ordersQuery = query(collection(db, 'orders'), where('buyerId', '==', currentUserId));
    const orderSnapshot = await getDocs(ordersQuery);

    const petDataList = [];

    // Step 2: For each order, get the petId and fetch pet data
    for (const orderDoc of orderSnapshot.docs) {
      const petId = orderDoc.data().petId;
      if (petId) {
        const petRef = doc(db, 'pets', petId);
        const petSnap = await getDoc(petRef);
        if (petSnap.exists()) {
          petDataList.push({ id: petSnap.id, ...petSnap.data() });
        }
      }
    }

    // Step 3: Return all fetched pet data
    return petDataList;

  } catch (error) {
    console.error("Error fetching pet data:", error);
    return [];
  }
};
export const sendLostPetNotification = async (petData) => {
  try {
    // Create a notification message with pet details
    const notificationData = {
      title: `Lost Pet Alert: ${petData.breed}`,
      body: `A ${petData.color} ${petData.breed} was reported lost. Please help!`,
      data: {
        type: 'lost_pet',
        petId: petData.id, // Assuming the pet has an ID after being saved
        breed: petData.breed,
        color: petData.color,
        location: petData.lostAddress,
        imageUrl: petData.media && petData.media.length > 0 ? petData.media[0].url : null
      }
    };

    // Call your API endpoint to send the notification
    const response = await fetch('/api/notifications/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }
    
    return result;
  } catch (error) {
    console.error("Error sending lost pet notification:", error);
    throw error;
  }
};
export  const sendBroadcastNotification = async (data) => {
  try {
    const response = await axios.post('https://www.pawin.co.in/api/broadcast', {
      title: data.title,
      body: data.body,
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response ? error.response.data : error.message);
  }
};