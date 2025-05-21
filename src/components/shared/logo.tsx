import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Logo({ className, width = 50, height = 50 }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B8E23"/>
            <stop offset="100%" stopColor="#3A4D14"/>
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="90" stroke="#556B2F" strokeWidth="4" fill="none"/>
        <circle cx="100" cy="100" r="80" stroke="#556B2F" strokeWidth="6" fill="none"/>

        <text x="85" y="130"
              fontFamily="'Cormorant Garamond', serif"
              fontSize="66" fontWeight="700"
              fill="url(#textGradient)"
              textAnchor="middle">
          M
        </text>

        <text x="115" y="115"
              fontFamily="'Cormorant Garamond', serif"
              fontSize="66" fontWeight="700"
              fill="url(#textGradient)"
              textAnchor="middle">
          W
        </text>
      </svg>
    </div>
  );
}
