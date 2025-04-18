"use client"

import { useTheme } from 'next-themes';

// Simple seedable random function
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function FlowerChain() {
  const { theme } = useTheme();

  // More flowers for a denser chain
  const flowerCount = 50

  // Animation keyframes as a string for the style tag
  const keyframesStyle = `
    @keyframes flowerMove {
      0% {
        transform: translate(0, 0) rotate(0deg);
      }
      50% {
        transform: translate(10px, 10px) rotate(3deg);
      }
      100% {
        transform: translate(0, 0) rotate(0deg);
      }
    }
    
    @keyframes floatUpDown {
      0% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-15px);
      }
      100% {
        transform: translateY(0);
      }
    }
  `

  // Generate the flowers array with better distribution
  const flowers = Array.from({ length: flowerCount }).map((_, i) => {
    // Use deterministic random values based on index
    const seedX = i * 0.1;
    const seedY = i * 0.2;
    const seedSize = i * 0.3;
    const seedDuration = i * 0.4;
    
    // Improved distribution to appear throughout the page
    // For some flowers, position them in the content area
    const isInContentArea = i % 3 === 0;
    
    let x, y;
    
    if (isInContentArea) {
      // Position these flowers in the middle areas of the page
      x = 25 + (seededRandom(seedX) * 60);
      y = 20 + (seededRandom(seedY) * 70);
    } else {
      // Position remaining flowers more evenly across the entire page
      x = seededRandom(seedX) * 100;
      y = seededRandom(seedY) * 100;
    }

    // Calculate animation delay based on position (deterministic)
    const animationDelay = i * 0.1
    
    // Random size between 16 and 24 (using seeded random)
    const size = Math.floor(seededRandom(seedSize) * 8) + 16
    
    // Random animation duration between 6 and 10 seconds (using seeded random)
    const animationDuration = Math.floor(seededRandom(seedDuration) * 4) + 6

    return { x, y, animationDelay, size, animationDuration }
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframesStyle }} />
      {/* The pointer-events-none is critical to ensure all click events pass through to content */}
      <div className="fixed -z-10 inset-0 w-full h-full overflow-hidden pointer-events-none">
        {flowers.map((flower, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${flower.x.toFixed(4)}%`,
              top: `${flower.y.toFixed(4)}%`,
              opacity: 0.12,
              animationName: "flowerMove, floatUpDown",
              animationDuration: `${flower.animationDuration}s, ${flower.animationDuration + 2}s`,
              animationTimingFunction: "ease-in-out, ease-in-out",
              animationIterationCount: "infinite, infinite",
              animationDelay: `${flower.animationDelay}s, ${flower.animationDelay}s`
            }}
          >
            <svg 
              width={flower.size} 
              height={flower.size} 
              viewBox="0 0 28 28" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 4C11.5 4 9.5 6 9.5 8.5C9.5 11 11.5 13 14 13C16.5 13 18.5 11 18.5 8.5C18.5 6 16.5 4 14 4Z"
                className="fill-black dark:fill-white"
              />
              <path
                d="M14 15C11.5 15 9.5 17 9.5 19.5C9.5 22 11.5 24 14 24C16.5 24 18.5 22 18.5 19.5C18.5 17 16.5 15 14 15Z"
                className="fill-black dark:fill-white"
              />
              <path
                d="M8.5 9.5C6 9.5 4 11.5 4 14C4 16.5 6 18.5 8.5 18.5C11 18.5 13 16.5 13 14C13 11.5 11 9.5 8.5 9.5Z"
                className="fill-black dark:fill-white"
              />
              <path
                d="M19.5 9.5C17 9.5 15 11.5 15 14C15 16.5 17 18.5 19.5 18.5C22 18.5 24 16.5 24 14C24 11.5 22 9.5 19.5 9.5Z"
                className="fill-black dark:fill-white"
              />
              <circle cx="14" cy="14" r="3.5" className="fill-black dark:fill-white" />
            </svg>
          </div>
        ))}
      </div>
    </>
  )
} 