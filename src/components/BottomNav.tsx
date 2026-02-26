
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Heart, Activity, MessageSquare, User, Flower2, Stars, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Roots', icon: Flower2, path: '/' },
    { label: 'Mirror', icon: Heart, path: '/vault' },
    { label: 'Wisdom', icon: BookOpen, path: '/blog' },
    { label: 'Village', icon: MessageSquare, path: '/forum' },
    { label: 'Spirit', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/80 backdrop-blur-lg border-t border-white/5 px-4 py-3 flex items-center justify-between z-50">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors flex-1",
            pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className={cn("w-5 h-5", pathname === item.path && "animate-in zoom-in-50 duration-300")} />
          <span className="text-[9px] font-medium uppercase tracking-wider italic">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
