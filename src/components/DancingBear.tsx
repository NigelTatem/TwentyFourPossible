'use client';

import React, { useState, useEffect } from 'react';

interface DancingBearProps {
  className?: string;
  bearsCount?: number;
}

interface BearState {
  id: number;
  position: { x: number };
  direction: 'left' | 'right';
  speed: number;
  showMessage: boolean;
  currentMessage: string;
}

const DancingBear: React.FC<DancingBearProps> = ({ className = '', bearsCount = 1 }) => {
  const [bears, setBears] = useState<BearState[]>([]);

  const encouragingMessages = [
    "You've got this! 🌟",
    "Keep pushing forward! 💪",
    "Almost there, champion! 🏆",
    "Your determination is inspiring! ✨",
    "One step at a time! 👣",
    "Believe in yourself! 🌈",
    "You're doing amazing! 🎯",
    "Stay focused, stay strong! 🔥",
    "The finish line awaits! 🏁",
    "Your future self will thank you! 💝",
    "Progress over perfection! 📈",
    "You're unstoppable! ⚡",
    "Dream big, work hard! 💭",
    "Success is a journey! 🛤️",
    "You're making it happen! ⭐",
    "I'm rooting for you! 🐻",
    "Every moment counts! ⏰",
    "You're a legend in the making! 🌠",
    "Small steps, big results! 🏔️",
    "The best time is NOW! 🚀",
    "You're crushing it! 🔨",
    "Keep that momentum! 🎢",
    "Your dedication amazes me! 💎",
    "Level up time! 🎮",
    "You're on fire! 🔥",
    "Dance with purpose! 💃",
    "Chase those dreams! 🌙",
    "Power through! ⚡",
    "You're my hero! 🦸",
    "Make every second count! ⏳"
  ];

  // Initialize bears when bearsCount changes
  useEffect(() => {
    const newBears: BearState[] = [];
    for (let i = 0; i < bearsCount; i++) {
      // Distribute bears evenly across the space to avoid overlap
      const spacing = 80 / Math.max(1, bearsCount); // 80% of container width
      const startX = 10 + (i * spacing); // Start at 10% + spacing
      
      newBears.push({
        id: i,
        position: { x: startX },
        direction: i % 2 === 0 ? 'right' : 'left', // Alternate directions
        speed: 1.8 + (i * 0.4), // Slightly different speeds
        showMessage: false,
        currentMessage: ''
      });
    }
    setBears(newBears);
    
    // Show initial welcome message after a short delay
    setTimeout(() => {
      if (newBears.length > 0) {
        setBears(prevBears => 
          prevBears.map((bear, index) => {
            if (index === 0) {
              return {
                ...bear,
                showMessage: true,
                currentMessage: "Welcome to your challenge! 🌟"
              };
            }
            return bear;
          })
        );
        
        setTimeout(() => {
          setBears(prevBears => 
            prevBears.map(bear => ({
              ...bear,
              showMessage: false
            }))
          );
        }, 3000);
      }
    }, 1000);
  }, [bearsCount]);

  // Movement animation
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setBears(prevBears => 
        prevBears.map(bear => {
          let newX = bear.position.x;
          let newDirection = bear.direction;
          
          if (bear.direction === 'right') {
            newX += bear.speed;
            if (newX >= 95) { // Go to 95% right
              newDirection = 'left';
            }
          } else {
            newX -= bear.speed;
            if (newX <= 1) { // Go to 1% left (almost to the edge)
              newDirection = 'right';
            }
          }
          
          return {
            ...bear,
            position: { x: newX },
            direction: newDirection
          };
        })
      );
    }, 100);

    return () => clearInterval(moveInterval);
  }, [bears.length]);

  // Show encouraging messages more frequently
  useEffect(() => {
    if (bears.length === 0) return;
    
    const messageInterval = setInterval(() => {
      if (Math.random() < 0.9) { // 90% chance every interval
        const randomBearIndex = Math.floor(Math.random() * bears.length);
        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        
        setBears(prevBears => 
          prevBears.map((bear, index) => {
            if (index === randomBearIndex) {
              return {
                ...bear,
                showMessage: true,
                currentMessage: randomMessage
              };
            }
            return bear;
          })
        );
        
        setTimeout(() => {
          setBears(prevBears => 
            prevBears.map((bear, index) => {
              if (index === randomBearIndex) {
                return {
                  ...bear,
                  showMessage: false
                };
              }
              return bear;
            })
          );
        }, 4000); // Show message for 4 seconds
      }
    }, 2500); // Show every 2.5 seconds for much more frequent messages

    return () => clearInterval(messageInterval);
  }, [bears.length]); // Removed encouragingMessages from dependencies to prevent restart

  return (
    <div className={`relative w-full h-40 pointer-events-none overflow-visible ${className}`}>
      {bears.map((bear) => (
        <div
          key={bear.id}
          className="absolute transition-all duration-100 ease-linear"
          style={{
            left: `${bear.position.x}%`,
            top: '50%',
            transform: `translateY(-50%) ${bear.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
            zIndex: bear.showMessage ? 20 : 10
          }}
        >
          {/* Bear GIF */}
          <img
            src="/bear-sprite.gif"
            alt="Dancing Bear"
            className="w-24 h-24"
            style={{
              imageRendering: 'pixelated',
            }}
          />
          
                     {/* Speech bubble - Keep text orientation fixed and prevent overflow */}
           {bear.showMessage && (
             <div 
               className="absolute -top-20 animate-bounce z-50"
               style={{
                 left: bear.position.x > 70 ? '-120px' : bear.position.x < 30 ? '20px' : '50%',
                 transform: bear.position.x > 70 || bear.position.x < 30
                   ? `${bear.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}` 
                   : `translateX(-50%) ${bear.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
               }}>
              <div className="bg-white rounded-lg px-4 py-2 shadow-xl border-2 border-gray-300 relative max-w-[250px]"
                   style={{
                     transform: bear.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                   }}>
                <p className="text-sm font-medium text-gray-800 text-center leading-tight">
                  {bear.currentMessage}
                </p>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-gray-300 rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Bear count indicator */}
      {bearsCount > 1 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold z-30 animate-bounce-slow">
          {bearsCount} Pet Bears 🐻
        </div>
      )}
    </div>
  );
};

export default DancingBear; 