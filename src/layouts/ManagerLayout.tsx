// src/layouts/ManagerLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "./AppShell";
import { getSidebarUserCard } from "../utils/sidebarUser";
import "../index.css";

export default function ManagerLayout() {
  const [avatarRefresh, setAvatarRefresh] = useState(0);

  useEffect(() => {
    const onAvatarUpdated = () => setAvatarRefresh((r) => r + 1);
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated);
  }, []);

  const userCard = useMemo(
    () => getSidebarUserCard("Manager", "Team overview"),
    [avatarRefresh]
  );

  return (
    <AppShell
      badge="Manager"
      title="Manager Workspace"
      subtitle="Team workspace"
      profilePath="/manager/profile"
      nav={[
        { to: "/manager/dashboard", label: "Dashboard" },
        { to: "/manager/team", label: "My Team" },
        { to: "/manager/activities", label: "Activities" },
        { to: "/manager/skills", label: "Skills Management", end: true },
        { to: "/manager/skills/assign", label: "Assign Skills", end: true },
        { to: "/manager/notifications", label: "Notifications" },
      ]}
      topbarRight={
        <>
          <input className="input" placeholder="Search team, activities…" />
          <button className="btn btn-ghost">Reports</button>
          <button className="btn btn-primary">New Review</button>
        </>
      }
      userCard={userCard}
    />
  );
}