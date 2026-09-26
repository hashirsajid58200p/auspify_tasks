"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PieChart, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: PieChart,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Wallet,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div className="grid h-full grid-cols-5 items-center px-2">
        {/* Item 1: Dashboard */}
        <Link
          href={mobileNavItems[0].href}
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors",
            pathname === mobileNavItems[0].href
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className="size-5" />
          <span className="text-[10px] mt-0.5">{mobileNavItems[0].name}</span>
        </Link>

        {/* Item 2: Transactions */}
        <Link
          href={mobileNavItems[1].href}
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors",
            pathname.startsWith(mobileNavItems[1].href)
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="size-5" />
          <span className="text-[10px] mt-0.5">{mobileNavItems[1].name}</span>
        </Link>

        {/* Center Item: Floating Add (+) Action */}
        <div className="flex items-center justify-center">
          <Link
            href="/transactions?action=new"
            className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95 hover:bg-primary/90"
            aria-label="Add new transaction"
          >
            <Plus className="size-6" />
          </Link>
        </div>

        {/* Item 3: Reports */}
        <Link
          href={mobileNavItems[2].href}
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors",
            pathname.startsWith(mobileNavItems[2].href)
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PieChart className="size-5" />
          <span className="text-[10px] mt-0.5">{mobileNavItems[2].name}</span>
        </Link>

        {/* Item 4: Budgets */}
        <Link
          href={mobileNavItems[3].href}
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors",
            pathname.startsWith(mobileNavItems[3].href)
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wallet className="size-5" />
          <span className="text-[10px] mt-0.5">{mobileNavItems[3].name}</span>
        </Link>
      </div>
    </nav>
  );
}
