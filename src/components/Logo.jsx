import Link from 'next/link';
import Image from 'next/image';
import Lily from '@/assets/Lily.png';

export function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-3 mt-2">
        <Image src={Lily} alt="Lily Logo" width={52} height={52} />
        <span className="text-black dark:text-white text-3xl font-xs">Lily</span>
      </div>
    </Link>
  );
} 