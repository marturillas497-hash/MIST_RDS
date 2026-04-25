"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function NavItem({ href, icon, label, exact = false }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link href={href} className={isActive ? "nav-item-active" : "nav-item"}>
      <span style={{ fontSize: "1.125rem" }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function StudentSidebar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

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
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Sidebar profile={profile} onSignOut={handleSignOut}>
      <NavItem href="/adviser" icon="⬚" label="Dashboard" exact />
      <NavItem href="/library" icon="◫" label="Research Library" />
    </Sidebar>
  );
}

export function AdminSidebar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Sidebar profile={profile} onSignOut={handleSignOut}>
      <NavItem href="/admin" icon="⬚" label="Dashboard" exact />
      <NavItem href="/admin/archive" icon="⊕" label="Add Abstract" />
      <NavItem href="/admin/approvals" icon="◈" label="Approvals" />
      <NavItem href="/admin/analytics" icon="◳" label="Analytics" />
      <NavItem href="/library" icon="◫" label="Library" />
    </Sidebar>
  );
}

function Sidebar({ profile, onSignOut, children }) {
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, height: "100vh", width: "16rem",
      backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column", zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "1.25rem", borderBottom: "1px solid #f1f5f9",
      }}>
        <div style={{
          width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
          backgroundColor: "#003366", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ color: "#ffcc00", fontFamily: "serif", fontSize: "1rem", fontWeight: "700" }}>
            M
          </span>
        </div>
        <div>
          <p style={{
            fontSize: "0.7rem", fontWeight: "700", color: "#002a52",
            letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1,
          }}>
            MIST
          </p>
          <p style={{ fontSize: "0.625rem", color: "#94a3b8", lineHeight: 1, marginTop: "0.25rem" }}>
            Research Discovery
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {children}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{
            width: "2rem", height: "2rem", borderRadius: "9999px",
            backgroundColor: "#e8eef5", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "#003366", fontSize: "0.75rem", fontWeight: "700" }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: "0.75rem", fontWeight: "600", color: "#1e293b",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {profile?.full_name || "User"}
            </p>
            <p style={{
              fontSize: "0.625rem", color: "#94a3b8", textTransform: "capitalize",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {profile?.role?.replace("_", " ") || ""}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          style={{
            width: "100%", textAlign: "left", fontSize: "0.75rem",
            color: "#94a3b8", background: "none", border: "none",
            cursor: "pointer", padding: "0.125rem 0.25rem",
          }}
          onMouseEnter={(e) => e.target.style.color = "#dc2626"}
          onMouseLeave={(e) => e.target.style.color = "#94a3b8"}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}