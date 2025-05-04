export interface Video {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  likeCount?: number;
  commentCount?: number;
  video?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  // Add other fields as needed
}

export interface Comment {
  id: string;
  text: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: {
    toDate: () => Date;
  };
  // Add other fields as needed
}