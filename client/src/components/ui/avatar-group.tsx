import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarGroupProps = {
  avatars: Array<{
    src?: string;
    alt: string;
    fallback: string;
  }>;
  max?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const AvatarGroup = ({
  avatars,
  max = 5,
  className,
  size = "md",
}: AvatarGroupProps) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  
  const avatarSize = sizeClasses[size];
  const ringSize = size === "sm" ? "ring-1" : "ring-2";
  
  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar 
          key={index} 
          className={cn(avatarSize, "ring-white", ringSize)}
        >
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div className={cn(
          "flex items-center justify-center rounded-full bg-gray-200", 
          avatarSize, 
          "ring-white", 
          ringSize
        )}>
          <span className="text-xs font-medium text-gray-700">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
};

export { AvatarGroup };
