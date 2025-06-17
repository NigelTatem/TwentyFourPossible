'use client';

import { useState, useEffect } from 'react';

const quotes = [
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "You learn more from failure than from success.", author: "Unknown" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { text: "If you are working on something that you really care about, you don't have to be pushed.", author: "Steve Jobs" },
  { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
  { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino" },
  { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "24 hours can change everything. Make them count.", author: "Make24Matter" },
  { text: "Every expert was once a beginner. Every pro was once an amateur.", author: "Robin Sharma" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" }
];

interface InspirationalQuoteProps {
  className?: string;
  autoRotate?: boolean;
  rotateInterval?: number;
}

export default function InspirationalQuote({ 
  className = "", 
  autoRotate = true, 
  rotateInterval = 15000 
}: InspirationalQuoteProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsVisible(true);
      }, 500); // Half second fade out before changing
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval]);

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div className={`text-center ${className}`}>
      <div 
        className={`transition-all duration-500 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <blockquote className="text-sm md:text-base italic text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
          "{currentQuote.text}"
        </blockquote>
        <cite className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
          — {currentQuote.author}
        </cite>
      </div>
      
      {/* Quote indicator dots */}
      <div className="flex justify-center space-x-1 mt-3">
        {quotes.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentQuoteIndex(index);
              setIsVisible(true);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentQuoteIndex % 5 
                ? 'bg-blue-500 scale-125' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 