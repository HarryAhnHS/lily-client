import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-3 mt-2">
        <svg width="52" height="52" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className="text-black dark:text-white text-3xl font-xs">Lily</span>
      </div>
    </Link>
  );
} 