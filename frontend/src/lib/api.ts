/**
 * Dynamic API URL helper for HireAI.
 * Automatically determines the backend address based on the current environment.
 */
export const getApiUrl = () => {
  // If the app is being run on the client side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Default to port 8002 for the backend
    return `${protocol}//${hostname}:8002`;
  }
  
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8002';
};
