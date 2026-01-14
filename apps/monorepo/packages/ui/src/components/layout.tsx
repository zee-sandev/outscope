import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

interface AppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface AppLayoutSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface AppLayoutMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface AppLayoutContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-screen bg-background", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AppLayout.displayName = "AppLayout";

const AppLayoutSidebar = React.forwardRef<
  HTMLDivElement,
  AppLayoutSidebarProps
>(({ className, children, ...props }, ref) => {
  return (
    <aside ref={ref} className={cn("flex-shrink-0", className)} {...props}>
      {children}
    </aside>
  );
});
AppLayoutSidebar.displayName = "AppLayoutSidebar";

const AppLayoutMain = React.forwardRef<HTMLDivElement, AppLayoutMainProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn("flex flex-col flex-1 overflow-hidden", className)}
        {...props}
      >
        {children}
      </main>
    );
  },
);
AppLayoutMain.displayName = "AppLayoutMain";

const AppLayoutContent = React.forwardRef<
  HTMLDivElement,
  AppLayoutContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-auto p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AppLayoutContent.displayName = "AppLayoutContent";

export { AppLayout, AppLayoutSidebar, AppLayoutMain, AppLayoutContent };
