import React, { useState } from "react";
import { Button } from "../components/ui/button";

interface WaitlistPageProps {
  className?: string;
  onClose?: () => void;
}

export const WaitlistPage: React.FC<WaitlistPageProps> = ({ className = "", onClose }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Successfully joined the waitlist!' });
        setEmail(''); // Clear the form
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-black rounded-[49px] border-5 border-[#64C967] p-12 w-[500px] max-w-[90vw] relative ${className}`}>
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:text-[#64C967] transition-colors"
        aria-label="Close"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <img
          className="w-20 h-20"
          alt="Logo"
          src="/logo(2).svg"
        />
      </div>

      {/* Title */}
      <h1 className="font-['Instrument_Serif'] font-normal text-4xl text-center text-white mb-4">
        Join our waitlist!
      </h1>

      {/* Subtitle */}
      <p className="font-['Instrument_Sans'] text-center text-white/80 text-base mb-8">
        We'll be there soon!
      </p>

      {/* Form */}
      <form onSubmit={handleJoinWaitlist} className="space-y-6">
        {/* Email Input */}
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-6 py-4 bg-white/10 border border-[#64C967] rounded-[34px] text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#64C967] focus:border-transparent font-['Instrument_Sans'] text-base disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={isLoading}
          />
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`text-center p-3 rounded-[16px] ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Join Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-[#64C967] hover:bg-[#50C953] disabled:bg-gray-500 disabled:hover:bg-gray-500 rounded-[34px] transition-colors border-0 disabled:cursor-not-allowed"
        >
          <span className="font-['Instrument_Sans'] font-bold text-black text-base tracking-[0] leading-normal">
            {isLoading ? 'Joining...' : 'Join'}
          </span>
        </Button>
      </form>
    </div>
  );
};
