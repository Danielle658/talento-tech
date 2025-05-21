import { Wallet } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface LogoProps extends Omit<LucideProps, 'ref'> {
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({ showText = true, className, textClassName, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Wallet className="h-8 w-8 text-primary" {...props} />
      {showText && (
        <span className={cn("text-2xl font-bold text-foreground", textClassName)}>
          MoneyWise
        </span>
      )}
    </div>
  );
}

// Helper function, assuming cn is available or define it
// For simplicity, if not using a utility like clsx + twMerge:
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
