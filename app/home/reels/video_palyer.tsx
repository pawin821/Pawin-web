"use client"
import React, { useState, useEffect, useRef } from 'react';

import { 
  getUserVideos, 
  likeVideo, 
  hasUserLikedVideo,
  addComment, 
  getVideoComments,
} from '../../../firebase/firebase';

import { Video, Comment } from '../../types';

import { BiHeart, BiSolidHeart, BiComment, BiShare, BiPause, BiPlay } from 'react-icons/bi';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

interface VideoPlayerProps {
  userId?: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ userId = null }) => {
  const { user } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const { userId: uid, isSignedIn } = useAuth();

  // Fetch videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const fetchedVideos = await getUserVideos();
        // Handle potential null response or convert Object to array if needed
        setVideos(Array.isArray(fetchedVideos) ? fetchedVideos : (fetchedVideos ? [fetchedVideos] : []));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userId]);

  // Check if current user has liked the current video
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (videos.length === 0 || !isSignedIn) return;
      
      const currentVideo = videos[currentVideoIndex];
      try {
        const liked = await hasUserLikedVideo(currentVideo.id, uid);
        setIsLiked(liked);
        console.log(liked);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
    
    // The effect cleanup function should return a non-promise value
    return () => {
      // Any cleanup code if needed
    };
  }, [videos, currentVideoIndex, isSignedIn, uid]);
  

  // Set up Intersection Observer for video playing
  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find which video is visible
          const videoIndex = videoRefs.current.findIndex(ref => ref === entry.target);
          if (videoIndex !== -1) {
            setCurrentVideoIndex(videoIndex);
            handlePlay(videoIndex);
            
            // Increment view counter when video comes into view
          
          }
        } else {
          // Pause when video is not visible
          const videoIndex = videoRefs.current.findIndex(ref => ref === entry.target);
          if (videoIndex !== -1 && videoRefs.current[videoIndex]) {
            videoRefs.current[videoIndex]?.pause();
          }
        }
      });
    }, {
      threshold: 0.7 // 70% of the element must be visible
    });

    // Observe all video elements
    if (videos.length > 0 && videoRefs.current.length > 0) {
      videoRefs.current.forEach(ref => {
        if (ref) observer.current?.observe(ref);
      });
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [videos]);

  // Handle manual play/pause
  const handlePlayPause = () => {
    if (!videoRefs.current[currentVideoIndex]) return;

    if (isPlaying) {
      videoRefs.current[currentVideoIndex]?.pause();
      setIsPlaying(false);
    } else {
      videoRefs.current[currentVideoIndex]?.play().catch(err => {
        console.error("Error playing video:", err);
      });
      setIsPlaying(true);
    }
  };

  // Play specific video
  const handlePlay = (index: number) => {
    if (!videoRefs.current[index]) return;

    // Pause all videos first
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== index) {
        video.pause();
      }
    });

    // Play the current video
    videoRefs.current[index]?.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error("Error playing video:", err);
      setIsPlaying(false);
    });
  };

  // Handle like/unlike
  const handleLike = async () => {
    if (!uid) {
      toast.error("Please log in to like videos");
      return;
    }

    if (loadingLike) return;

    const currentVideo = videos[currentVideoIndex];
    setLoadingLike(true);

    try {
      const likeStatus = await likeVideo(currentVideo.id, uid);
      setIsLiked(likeStatus);
      
      // Update like count in local state
      setVideos(prevVideos => {
        const updatedVideos = [...prevVideos];
        updatedVideos[currentVideoIndex] = {
          ...updatedVideos[currentVideoIndex],
          likeCount: likeStatus 
            ? (updatedVideos[currentVideoIndex].likeCount || 0) + 1
            : Math.max((updatedVideos[currentVideoIndex].likeCount || 0) - 1, 0)
        };
        return updatedVideos;
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to like video");
    } finally {
      setLoadingLike(false);
    }
  };

  // Load comments
  const loadComments = async () => {
    if (videos.length === 0) return;
    
    const currentVideo = videos[currentVideoIndex];
    
    try {
      const fetchedComments = await getVideoComments(currentVideo.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };

  // Toggle comments panel
  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast.error("Please log in to comment");
      return;
    }
    
    if (!newComment.trim() || loadingComment) return;
    
    const currentVideo = videos[currentVideoIndex];
    setLoadingComment(true);
    
    try {
      await addComment(currentVideo.id, { text: newComment.trim() }, uid, user);
      setNewComment('');
      
      // Update local comment count
      setVideos(prevVideos => {
        const updatedVideos = [...prevVideos];
        updatedVideos[currentVideoIndex] = {
          ...updatedVideos[currentVideoIndex],
          commentCount: (updatedVideos[currentVideoIndex].commentCount || 0) + 1
        };
        return updatedVideos;
      });
      
      // Reload comments to show the new comment
      await loadComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoadingComment(false);
    }
  };

  // Share video
  const handleShare = () => {
    const currentVideo = videos[currentVideoIndex];
    if (!currentVideo) return;
    
    // Create a shareable URL - this would depend on your app's routing structure
    const shareUrl = `${window.location.origin}/video/${currentVideo.id}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: currentVideo.title || 'Check out this video',
        text: currentVideo.description || 'Watch this interesting short video',
        url: shareUrl,
      }).catch(err => {
        console.error("Error sharing:", err);
      });
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Link copied to clipboard");
      }).catch(err => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy link");
      });
    }
  };

  // Scroll to next video
  const scrollToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1 && videoRefs.current[currentVideoIndex + 1]) {
      videoRefs.current[currentVideoIndex + 1]?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  // Scroll to previous video
  const scrollToPrevVideo = () => {
    if (currentVideoIndex > 0 && videoRefs.current[currentVideoIndex - 1]) {
      videoRefs.current[currentVideoIndex - 1]?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-lg font-medium mb-4">No videos found</p>
        <p className="text-sm text-gray-500">Videos will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <div className="h-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-full w-full snap-start relative"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current[index] = el;
              }}
              src={video.video?.url}
              className="h-full w-full object-contain"
              loop
              playsInline
              muted={false}
              controls={false}
              poster={video.thumbnail?.url}
            />
            
            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <h3 className="text-white font-bold text-lg">{video.title}</h3>
              <p className="text-white/80 text-sm line-clamp-2">{video.description}</p>
              
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {video.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Video Controls */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <button 
                onClick={handlePlayPause}
                className="bg-black/30 rounded-full p-4 text-white"
              >
                {isPlaying ? <BiPause size={30} /> : <BiPlay size={30} />}
              </button>
            </div>

            {/* Engagement Controls */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6">
              <button 
                onClick={handleLike}
                className="flex flex-col items-center"
                disabled={loadingLike}
              >
                {isLiked ? 
                  <BiSolidHeart className="text-red-500 text-3xl" /> : 
                  <BiHeart className="text-white text-3xl" />
                }
                <span className="text-white text-xs mt-1">{video.likeCount || 0}</span>
              </button>
              
              <button 
                onClick={toggleComments}
                className="flex flex-col items-center"
              >
                <BiComment className="text-white text-3xl" />
                <span className="text-white text-xs mt-1">{video.commentCount || 0}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex flex-col items-center"
              >
                <BiShare className="text-white text-3xl" />
                <span className="text-white text-xs mt-1">Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl h-2/3 z-50 animate-slide-up"
          ref={commentsRef}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-lg">Comments ({videos[currentVideoIndex]?.commentCount || 0})</h3>
            <button onClick={() => setShowComments(false)}>
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-4 h-[calc(100%-140px)] overflow-y-auto">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500">No comments yet</p>
                <p className="text-sm text-gray-400">Be the first to comment</p>
              </div>
            ) : (
              comments.map((comment: Comment) => (
                <div key={comment.id} className="mb-4 pb-4 border-b">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                      {comment.photoURL ? (
                        <img src={comment.photoURL} alt={comment.displayName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white">
                          {comment.displayName ? comment.displayName.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{comment.displayName || 'Anonymous'}</h4>
                        <span className="text-xs text-gray-500 ml-2">
                          {comment.createdAt?.toDate ? 
                            new Date(comment.createdAt.toDate()).toLocaleDateString() : 
                            'Just now'}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form 
            onSubmit={handleCommentSubmit}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t"
          >
            <div className="flex items-center">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border rounded-full py-2 px-4 mr-2"
                disabled={!isSignedIn || loadingComment}
              />
              <button 
                type="submit"
                className="bg-blue-500 text-white rounded-full py-2 px-6 font-medium"
                disabled={!newComment.trim() || !isSignedIn || loadingComment}
              >
                {loadingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Navigation buttons - optional */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        {currentVideoIndex > 0 && (
          <button 
            onClick={scrollToPrevVideo}
            className="bg-black/30 rounded-full p-2 text-white mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {currentVideoIndex < videos.length - 1 && (
          <button 
            onClick={scrollToNextVideo}
            className="bg-black/30 rounded-full p-2 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;