"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPlayer from './video_palyer';


const ClientReelsContent = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  return <VideoPlayer userId={userId} />;
};

export default ClientReelsContent;