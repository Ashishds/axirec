export const getApiUrl = () => {
  // Use environment variable if defined (for production/Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If the app is being run on the client side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Default to port 8000 for the backend in local dev
    return `http://${hostname}:8000`;
  }
  
  // Fallback for SSR
  return 'http://127.0.0.1:8000';
};
