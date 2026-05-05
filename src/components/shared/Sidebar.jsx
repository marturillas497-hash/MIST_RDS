"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function NavItem({ href, icon, label, exact = false, onClick }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={isActive ? "nav-item-active" : "nav-item"}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-navy-500 flex items-center justify-center flex-shrink-0">
        <span className="text-gold-500 font-serif text-base font-bold">M</span>
      </div>
      <div>
        <p className="text-[0.7rem] font-bold text-navy-600 tracking-widest uppercase leading-none">
          MIST
        </p>
        <p className="text-[0.6rem] text-slate-400 leading-none mt-1">
          Research Discovery
        </p>
      </div>
    </div>
  );
}

function UserFooter({ profile, onSignOut }) {
  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
          <span className="text-navy-500 text-xs font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {profile?.full_name || "User"}
          </p>
          <p className="text-[0.6rem] text-slate-400 capitalize truncate">
            {profile?.role?.replace("_", " ") || ""}
          </p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors text-left w-full"
      >
        Sign out
      </button>
    </div>
  );
}

function SidebarContent({ profile, onSignOut, children, onNavClick }) {
  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {Array.isArray(children)
          ? children.map((child, i) =>
              child ? { ...child, props: { ...child.props, onClick: onNavClick } } : child
            )
          : children}
      </nav>
      <UserFooter profile={profile} onSignOut={onSignOut} />
    </div>
  );
}

function Sidebar({ profile, onSignOut, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40">
        <div className="p-5 border-b border-slate-100">
          <Logo />
        </div>
        <SidebarContent profile={profile} onSignOut={onSignOut}>
          {children}
        </SidebarContent>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="md:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-60 flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          zIndex: 60,
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <SidebarContent
          profile={profile}
          onSignOut={onSignOut}
          onNavClick={() => setOpen(false)}
        >
          {children}
        </SidebarContent>
      </div>
    </>
  );
}

function useSidebarSetup() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return { handleSignOut };
}

export function StudentSidebar({ profile }) {
  const { handleSignOut } = useSidebarSetup();
  return (
    <Sidebar profile={profile} onSignOut={handleSignOut}>
      <NavItem href="/dashboard" icon="⬚" label="Dashboard" exact />
      <NavItem href="/submit" icon="⊕" label="New Scan" />
      <NavItem href="/library" icon="◫" label="Research Library" />
      <NavItem href="/profile" icon="◎" label="My Profile" />
    </Sidebar>
  );
}

export function AdviserSidebar({ profile }) {
  const { handleSignOut } = useSidebarSetup();
  return (
    <Sidebar profile={profile} onSignOut={handleSignOut}>
      <NavItem href="/adviser" icon="⬚" label="Dashboard" exact />
      <NavItem href="/submit" icon="⊕" label="New Scan" />
      <NavItem href="/library" icon="◫" label="Research Library" />
    </Sidebar>
  );
}

export function AdminSidebar({ profile }) {
  const { handleSignOut } = useSidebarSetup();
  return (
    <Sidebar profile={profile} onSignOut={handleSignOut}>
      <NavItem href="/admin" icon="⬚" label="Dashboard" exact />
      <NavItem href="/admin/archive" icon="⊕" label="Add Abstract" />
      <NavItem href="/admin/approvals" icon="◈" label="Approvals" />
      <NavItem href="/admin/analytics" icon="◳" label="Analytics" />
      <NavItem href="/library" icon="◫" label="Library" />
      <NavItem href="/admin/whitelist" icon="◉" label="Whitelist" />
    </Sidebar>
  );
}