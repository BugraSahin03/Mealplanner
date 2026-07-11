import Link from "next/link";

import { buildWeekHref } from "@/src/week-context/weeks";

type AppArea = "home" | "plan" | "planner" | "shopping" | "profile";

type AppBottomNavProps = {
  active: AppArea;
  weekId?: string;
};

export function AppBottomNav({ active, weekId }: AppBottomNavProps) {
  const items: Array<{ area: AppArea; href: string; label: string }> = [
    { area: "home", href: "/", label: "Start" },
    {
      area: "plan",
      href: weekId ? buildWeekHref("/plan", weekId) : "/plan",
      label: "Plan erstellen",
    },
    {
      area: "planner",
      href: weekId ? buildWeekHref("/planner", weekId) : "/planner",
      label: "Wochenplan",
    },
    {
      area: "shopping",
      href: weekId ? buildWeekHref("/shopping-list", weekId) : "/shopping-list",
      label: "Einkaufsliste",
    },
    { area: "profile", href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="app-bottom-nav" aria-label="Hauptnavigation">
      {items.map((item) => (
        <Link
          aria-current={active === item.area ? "page" : undefined}
          href={item.href}
          key={item.area}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
