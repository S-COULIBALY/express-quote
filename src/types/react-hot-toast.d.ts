declare module 'react-hot-toast' {
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
  export const Toaster: React.FC<{ position?: string }>;
} 