/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: Cursor targets use hover-only affordances. */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: Cursor targets are decorative hover zones. */

"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  type SpringOptions,
  useMotionValue,
  useSpring,
} from "motion/react";
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type MotionDivAnimate = NonNullable<
  ComponentProps<typeof motion.div>["animate"]
>;

const DEFAULT_CURSOR_COLOR = "#00F0FF";

const customCursorVariants = cva("relative", {
  variants: {
    layout: {
      default: "w-full h-full",
      demo: "flex min-h-72 items-center justify-center",
    },
  },
  defaultVariants: {
    layout: "default",
  },
});

const customCursorTargetVariants = cva(
  "flex items-center justify-center transition-opacity hover:opacity-80",
  {
    variants: {
      size: {
        sm: "size-10",
        md: "size-14",
        lg: "size-16",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface CustomCursorContextValue {
  setIsHovering: (isHovering: boolean) => void;
}

const CustomCursorContext = createContext<CustomCursorContextValue | null>(
  null
);

function useCustomCursorContext() {
  const context = useContext(CustomCursorContext);

  if (!context) {
    throw new Error(
      "CustomCursorTarget must be used within a CustomCursor provider."
    );
  }

  return context;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return `rgba(0, 240, 255, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function resolveCursorAppearance(
  isHovering: boolean,
  isMouseDown: boolean,
  color: string
): MotionDivAnimate {
  if (!isHovering) {
    return {
      width: 14,
      height: 14,
      scale: isMouseDown ? 0.75 : 1,
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1.5,
    };
  }

  return {
    width: 44,
    height: 44,
    scale: isMouseDown ? 0.88 : 1,
    backgroundColor: hexToRgba(color, 0.22),
    borderColor: color,
    borderWidth: 2,
  };
}

export interface CustomCursorProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children">,
    VariantProps<typeof customCursorVariants> {
  children?: ReactNode;
  /** Cursor fill and border color. */
  color?: string;
  /** Spring damping for pointer follow. */
  followDamping?: number;
  /** Spring stiffness for pointer follow. */
  followStiffness?: number;
  /** Override spring options for pointer follow. */
  followTransition?: SpringOptions;
  /** Enable automatic hover detection on all interactive website elements (buttons, links, inputs). */
  autoDetectInteractive?: boolean;
}

function CustomCursor({
  children,
  className,
  color = DEFAULT_CURSOR_COLOR,
  followDamping = 24,
  followStiffness = 280,
  followTransition,
  layout = "default",
  autoDetectInteractive = true,
  ...props
}: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchOnly, setIsTouchOnly] = useState(false);

  // Position motion values (starts offscreen to prevent top-left freeze)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springTransition = followTransition ?? {
    damping: followDamping,
    stiffness: followStiffness,
    mass: 0.5,
  };

  const springX = useSpring(cursorX, springTransition);
  const springY = useSpring(cursorY, springTransition);

  const contextValue = useMemo<CustomCursorContextValue>(
    () => ({
      setIsHovering,
    }),
    []
  );

  useEffect(() => {
    // Only disable if device is purely a touchscreen with no mouse or trackpad
    const touchOnlyQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouchOnly(touchOnlyQuery.matches);

    const handleTouchChange = (e: MediaQueryListEvent) => {
      setIsTouchOnly(e.matches);
    };

    try {
      touchOnlyQuery.addEventListener("change", handleTouchChange);
    } catch {
      // Fallback for older browsers
    }

    if (touchOnlyQuery.matches) {
      return;
    }

    const updatePosition = (clientX: number, clientY: number) => {
      cursorX.set(clientX);
      cursorY.set(clientY);
      setIsVisible(true);
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
      setIsHovering(false);
    };

    const handleMouseEnterWindow = () => {
      setIsVisible(true);
    };

    // Auto-detect interactive elements under the cursor
    const handleOver = (e: Event) => {
      if (!autoDetectInteractive) return;
      const target = (e.target || (e as any).composedPath?.()[0]) as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, input, select, textarea, [role="button"], [data-cursor], .cursor-pointer, [data-interactive="true"], [tabindex]:not([tabindex="-1"])'
      );
      if (interactive) {
        setIsHovering(true);
      }
    };

    const handleOut = (e: MouseEvent) => {
      if (!autoDetectInteractive) return;
      const related = (e.relatedTarget || (e as any).toElement) as HTMLElement | null;
      if (
        related &&
        related.closest(
          'button, a, input, select, textarea, [role="button"], [data-cursor], .cursor-pointer, [data-interactive="true"], [tabindex]:not([tabindex="-1"])'
        )
      ) {
        return;
      }
      setIsHovering(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true, capture: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true, capture: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true, capture: true });

    document.documentElement.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.documentElement.addEventListener("mouseenter", handleMouseEnterWindow);

    if (autoDetectInteractive) {
      document.addEventListener("mouseover", handleOver, { passive: true, capture: true });
      document.addEventListener("mouseout", handleOut, { passive: true, capture: true });
    }

    return () => {
      try {
        touchOnlyQuery.removeEventListener("change", handleTouchChange);
      } catch {
        // Fallback
      }
      window.removeEventListener("pointermove", handlePointerMove, { capture: true });
      window.removeEventListener("mousemove", handleMouseMove, { capture: true });
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", handleMouseUp, { capture: true });

      document.documentElement.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnterWindow);

      if (autoDetectInteractive) {
        document.removeEventListener("mouseover", handleOver, { capture: true });
        document.removeEventListener("mouseout", handleOut, { capture: true });
      }
    };
  }, [cursorX, cursorY, autoDetectInteractive]);

  const appearance = resolveCursorAppearance(isHovering, isMouseDown, color);

  return (
    <CustomCursorContext.Provider value={contextValue}>
      <div
        className={cn(customCursorVariants({ layout, className }))}
        {...props}
      >
        {isTouchOnly ? null : (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-0 z-[999999]"
            style={{
              x: springX,
              y: springY,
              opacity: isVisible ? 1 : 0,
            }}
          >
            {/* Center target ring that animates on hover and click */}
            <motion.div
              animate={appearance}
              className="-translate-x-1/2 -translate-y-1/2 rounded-full relative flex items-center justify-center transition-[box-shadow] duration-200"
              initial={false}
              style={{
                boxShadow: isHovering
                  ? `0 0 20px ${color}, 0 0 10px ${color}`
                  : `0 0 10px ${color}`,
              }}
              transition={{
                duration: 0.2,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              {/* Inner pinpoint dot when hovered */}
              {isHovering && (
                <div
                  className="w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
        {children}
      </div>
    </CustomCursorContext.Provider>
  );
}

export interface CustomCursorTargetProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children">,
    VariantProps<typeof customCursorTargetVariants> {
  children?: ReactNode;
}

function CustomCursorTarget({
  children,
  className,
  size,
  ...props
}: CustomCursorTargetProps) {
  const { setIsHovering } = useCustomCursorContext();

  return (
    <div
      className={cn(customCursorTargetVariants({ size, className }))}
      data-cursor=""
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  CustomCursor,
  CustomCursorTarget,
  customCursorTargetVariants,
  customCursorVariants,
};

export default CustomCursor;
