import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

function getTheme(token: string): string {
  return token;
}

export const textSizeVariant = {
  H1: getTheme("text-[32px]"),
  H2: getTheme("text-[28px]"),
  H3: getTheme("text-2xl"),
  H4: getTheme("text-xl"),
  H5: getTheme("text-[40px]"),
  B1: getTheme("text-base"),
  B2: getTheme("text-sm"),
  C1: getTheme("text-xs"),
  N1: getTheme("text-2xl"),
} as const;

export const textWeightVariant = {
  regular: getTheme("font-normal"),
  medium: getTheme("font-medium"),
  bold: getTheme("font-bold"),
} as const;

export const textColorVariant = {
  default: getTheme("text-foreground"),
  "default-inverse": getTheme("text-background"),
  primary: getTheme("text-primary"),
  muted: getTheme("text-muted-foreground"),
  success: getTheme("text-green-600"),
  error: getTheme("text-red-600"),
  subtitle: getTheme("text-muted-foreground"),
  "subtitle-muted": getTheme("text-muted-foreground/80"),
  cascade: getTheme("text-foreground"),
  "mist-gray-700": getTheme("text-gray-700"),
  "vp-pass-desc": getTheme("text-gray-600"),
  "vp-pass-date": getTheme("text-gray-500"),
  "muted-400": getTheme("text-muted-foreground"),
  "puerto-rico-700": getTheme("text-emerald-700"),
  danger: getTheme("text-red-600"),
  "pizazz-600": getTheme("text-orange-600"),
  "sky-blue": getTheme("text-sky-500"),
  "dark-red": getTheme("text-red-800"),
  "dark-gray": getTheme("text-gray-800"),
  "jet-black": getTheme("text-black"),
  "fire-engine-red": getTheme("text-red-700"),
  "dark-teal": getTheme("text-teal-800"),
  orange: getTheme("text-orange-500"),
  line: getTheme("text-gray-300"),
} as const;

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof textSizeVariant;
  weight?: keyof typeof textWeightVariant;
  color?: keyof typeof textColorVariant;
  as?: React.ElementType;
}

const defaultProps: Required<Pick<TextProps, "size" | "weight" | "color">> = {
  size: "B1",
  weight: "regular",
  color: "primary",
};

export const Text: React.FC<TextProps> = (props) => {
  const {
    className,
    children,
    size = defaultProps.size,
    weight = defaultProps.weight,
    color = defaultProps.color,
    as = "span",
    ...restProps
  } = props;

  const mergedClassName = cn(
    textSizeVariant[size],
    textWeightVariant[weight],
    textColorVariant[color],
    className,
  );

  const Component = as as React.ElementType;

  return (
    <Component {...restProps} className={mergedClassName}>
      {children}
    </Component>
  );
};

Text.displayName = "Text";
