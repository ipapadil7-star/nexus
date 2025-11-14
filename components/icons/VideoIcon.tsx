
import React from 'react';

export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 4.5h15v15h-15z" />
    <path d="M8.5 4.5v15" />
    <path d="M15.5 4.5v15" />
    <path d="M4.5 8.5h15" />
    <path d="M4.5 15.5h15" />
  </svg>
);
