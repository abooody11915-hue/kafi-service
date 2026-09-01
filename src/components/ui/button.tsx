import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Premium button system — one source of truth.
 * Variants are intentionally limited:
 *  - default   : primary action (solid green)
 *  - premium   : hero CTA only (gradient + glow). Use sparingly.
 *  - soft      : tinted secondary action
 *  - outline   : bordered neutral
 *  - ghost     : low-emphasis
 *  - destructive
 *  - link
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[14px] font-semibold ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-press",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 hover:shadow-sm",
        premium:
          "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/92",
        outline:
          "border border-border bg-card text-foreground hover:bg-accent hover:border-border",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        soft: "bg-primary/10 text-primary hover:bg-primary/15",
        ghost: "text-foreground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        edit:
          "bg-gold-soft/50 text-gold-deep border border-gold/30 ring-1 ring-gold/20 shadow-xs hover:bg-gold-soft hover:border-gold/50 dark:bg-gold-deep/20 dark:text-gold-soft dark:border-gold/30",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-lg px-3.5 text-[13px]",
        lg: "h-12 rounded-xl px-7 text-[15px]",
        xl: "h-14 rounded-xl px-8 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
