"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, LogOut, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useStacks } from "@/providers/StacksProvider";
import { useAuth } from "@/hooks/useAuth";
import { truncateAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/verify", label: "Verify" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/faucet", label: "Faucet" },
];

export function Header() {
  const pathname = usePathname();
  const { stxAddress, isConnected, connectWallet, disconnectWallet } = useStacks();
  const { isAuthenticated, user, login, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-white">
            Sats<span className="text-amber-500">ID</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected && isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700 bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-black" />
                    </div>
                    <span className="text-sm">
                      {user?.bnsName || truncateAddress(stxAddress || "")}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    disconnectWallet();
                  }}
                  className="text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isConnected ? (
            <Button
              onClick={login}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Sign In
            </Button>
          ) : (
            <Button
              onClick={connectWallet}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-gray-950 border-gray-800">
            <SheetTitle className="text-white">Navigation</SheetTitle>
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-800 pt-4">
                {isConnected && isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400"
                    onClick={() => {
                      logout();
                      disconnectWallet();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    onClick={() => {
                      isConnected ? login() : connectWallet();
                      setMobileOpen(false);
                    }}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isConnected ? "Sign In" : "Connect Wallet"}
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
