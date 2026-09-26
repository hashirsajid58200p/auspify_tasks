"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-[#191919] group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-black dark:group-[.toaster]:border-white/50 group-[.toaster]:shadow-neo group-[.toaster]:rounded-2xl font-bold",
          description: "group-[.toast]:text-muted-foreground font-medium",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white font-bold group-[.toast]:rounded-xl border border-black",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-foreground font-bold group-[.toast]:rounded-xl border border-black",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
