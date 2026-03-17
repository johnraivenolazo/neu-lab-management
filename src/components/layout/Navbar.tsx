"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, History, UserCheck, Menu, QrCode } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebase } from '@/firebase/provider';
import { signOutUser } from '@/lib/auth-service';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavbarProps {
  user: {
    displayName: string;
    email: string;
    role: 'admin' | 'professor';
    photoURL?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = useFirebase();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => {
    if (user.role === 'admin') {
      return [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/admin' },
        { href: '/admin/logs', label: 'Logs', icon: History, match: (p: string) => p.startsWith('/admin/logs') },
        { href: '/admin/users', label: 'Professors', icon: UserCheck, match: (p: string) => p.startsWith('/admin/users') },
        { href: '/admin/qr', label: 'QR Codes', icon: QrCode, match: (p: string) => p.startsWith('/admin/qr') },
      ];
    }

    return [
      { href: '/professor', label: 'Check-In', icon: UserCheck, match: (p: string) => p === '/professor' },
      { href: '/professor/history', label: 'History', icon: History, match: (p: string) => p.startsWith('/professor/history') },
    ];
  }, [user.role]);

  const handleLogout = async () => {
    try {
      await signOutUser(auth);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      router.push('/');
    }
  };

  return (
    <nav className="border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden border-zinc-800 bg-zinc-950/70 text-zinc-200">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm p-0 bg-zinc-950 border-zinc-800">
              <SheetHeader className="px-5 pt-6 pb-4 border-b border-zinc-900">
                <SheetTitle className="text-white">Navigation</SheetTitle>
                <SheetDescription className="text-zinc-500">Access all pages from mobile and desktop.</SheetDescription>
              </SheetHeader>

              <div className="px-4 py-5 space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = item.match(pathname);

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                            active ? 'bg-zinc-100 text-black' : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    </motion.div>
                  );
                })}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start mt-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);

              return (
                <Link key={item.href} href={item.href} className="relative">
                  <motion.div
                    whileHover={{ y: -1 }}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      active ? 'text-black' : 'text-zinc-500 hover:text-zinc-100'
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-lg bg-zinc-100"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    ) : null}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-zinc-100">{user.displayName}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{user.role}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-offset-background transition-colors hover:ring-2 hover:ring-zinc-800">
                <Avatar className="h-10 w-10 border border-zinc-800">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback className="bg-zinc-900 text-zinc-400">{(user.displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-900 text-zinc-100" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-zinc-500">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-900" />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}