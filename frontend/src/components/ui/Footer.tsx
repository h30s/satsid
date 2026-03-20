import React from "react";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              Built on <span className="text-white font-medium">Stacks</span>. Secured by{" "}
              <span className="text-amber-500 font-medium">Bitcoin</span>.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/satsid"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
