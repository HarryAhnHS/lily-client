"use client"

import { useTheme } from 'next-themes';
import Image from 'next/image';
import FlowerBlue from '@/assets/FlowerBlue.png';
import FlowerGreen from '@/assets/FlowerGreen.png';
import FlowerOrange from '@/assets/FlowerOrange.png';
import FlowerPink from '@/assets/FlowerPink.png';

// Simple seedable random function
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function FlowerChain() {
    return (
        <div className='fixed inset-0 overflow-hidden z-0'>
            {/* Bottom Left - Blue Flower */}
            <div className='absolute bottom-0 left-0 transform -translate-x-1/3 translate-y-1/3'>
                <Image 
                    src={FlowerBlue} 
                    alt="Blue flower decoration" 
                    width={180} 
                    height={180} 
                    priority
                />
            </div>
            
            {/* Bottom Right - Orange Flower */}
            <div className='absolute bottom-0 right-0 transform translate-x-1/3 translate-y-1/3'>
                <Image 
                    src={FlowerOrange} 
                    alt="Orange flower decoration" 
                    width={200} 
                    height={200} 
                    priority
                />
            </div>
            
            {/* Top Left - Green Flower */}
            <div className='absolute bottom-10 left-10 transform -translate-x-1/2 -translate-y-1/2'>
                <Image 
                    src={FlowerGreen} 
                    alt="Green flower decoration" 
                    width={180} 
                    height={180} 
                    priority
                />
            </div>
            
            {/* Top Right - Pink Flower */}
            <div className='absolute bottom-20 right-20 transform translate-x-1/2 -translate-y-1/3'>
                <Image 
                    src={FlowerPink} 
                    alt="Pink flower decoration" 
                    width={170} 
                    height={170} 
                    priority
                />
            </div>
        </div>
    )
} 