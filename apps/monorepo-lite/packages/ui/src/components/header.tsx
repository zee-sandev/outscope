import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface HeaderLeftProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface HeaderCenterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface HeaderRightProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "flex items-center justify-between h-16 px-6 bg-background border-b border-border",
          className,
        )}
        {...props}
      >
        {children}
      </header>
    );
  },
);
Header.displayName = "Header";

const HeaderLeft = React.forwardRef<HTMLDivElement, HeaderLeftProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
HeaderLeft.displayName = "HeaderLeft";

const HeaderCenter = React.forwardRef<HTMLDivElement, HeaderCenterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 flex-1 justify-center",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
HeaderCenter.displayName = "HeaderCenter";

const HeaderRight = React.forwardRef<HTMLDivElement, HeaderRightProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
HeaderRight.displayName = "HeaderRight";

export { Header, HeaderLeft, HeaderCenter, HeaderRight };
