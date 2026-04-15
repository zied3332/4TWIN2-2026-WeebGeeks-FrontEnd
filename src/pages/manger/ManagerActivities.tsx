import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listActivities,
  getActivitySkills,
  type ActivityRecord,
  type ActivitySkillRecord,
} from "../../services/activities.service";
import { getUsers, type User } from "../../services/users.service";
import { getAllDepartments, type Department } from "../../services/departments.service";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

const btn: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid var(--input-border)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  background: bg,
  color,
  fontWeight: 900,
  fontSize: 13,
});

const statusColors: Record<string, [string, string]> = {
  PLANNED: ["color-mix(in srgb, var(--surface-2) 78%, #c7d2fe)", "color-mix(in srgb, var(--text) 86%, #3730a3)"],
  IN_PROGRESS: ["color-mix(in srgb, var(--surface-2) 78%, #86efac)", "color-mix(in srgb, var(--text) 84%, #15803d)"],
  COMPLETED: ["color-mix(in srgb, var(--surface-2) 78%, #bbf7d0)", "color-mix(in srgb, var(--text) 84%, #166534)"],
  CANCELLED: ["color-mix(in srgb, var(--surface-2) 78%, #fecaca)", "color-mix(in srgb, var(--text) 84%, #991b1b)"],
};

const contextColors: Record<string, [string, string]> = {
  UPSKILLING: ["color-mix(in srgb, var(--surface-2) 78%, #bae6fd)", "color-mix(in srgb, var(--text) 84%, #0369a1)"],
  EXPERTISE: ["color-mix(in srgb, var(--surface-2) 78%, #fde68a)", "color-mix(in srgb, var(--text) 84%, #b45309)"],
  DEVELOPMENT: ["color-mix(in srgb, var(--surface-2) 78%, #ddd6fe)", "color-mix(in srgb, var(--text) 84%, #6d28d9)"],
};

function formatLevel(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase();
}

function formatStatus(v: string) {
  return v.replaceAll("_", " ");
}

export default function ManagerActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [activitiesRes, usersRes, departmentsRes] = await Promise.allSettled([
          listActivities(),
          getUsers(),
          getAllDepartments(),
        ]);

        if (activitiesRes.status === "fulfilled") {
          setActivities(activitiesRes.value || []);
        }
        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value || []);
        }
        if (departmentsRes.status === "fulfilled") {
          setDepartments(departmentsRes.value || []);
        }
      } catch (e: any) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const managedDepartmentId = useMemo(() => {
    return String(currentUser?.department || "");
  }, [currentUser]);

  const filteredActivities = useMemo(() => {
    // Managers should only see activities explicitly assigned to their own department.
    if (!managedDepartmentId) return [];
    return activities.filter((a: any) => !!a.departmentId && String(a.departmentId) === managedDepartmentId);
  }, [activities, managedDepartmentId]);

  const managerNameById = useMemo(() => {
    const map = new Map<string, string>();
    users
      .filter((u) => String(u.role || "").toUpperCase() === "MANAGER")
      .forEach((m) => map.set(String(m._id), String(m.name || "-")));
    return map;
  }, [users]);

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(String(d._id), String(d.name || "-")));
    return map;
  }, [departments]);

  const openActivityReview = (activity: ActivityRecord) => {
    navigate(`/manager/activities/${activity._id}/review`);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: "center", padding: 40 }}>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="page-title">Department Activities</h1>
            <p className="page-subtitle">Activities for your department team members</p>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "var(--muted)", padding: 40 }}>
            <p>No activities for your department yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredActivities.map((activity: any) => (
              <div
                key={activity._id}
                onClick={() => openActivityReview(activity)}
                style={{
                  ...card,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 16,
                  alignItems: "start",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(59, 130, 246, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.08)";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text)", lineHeight: 1.25 }}>
                      {activity.title}
                    </div>
                    <span style={badge(...contextColors[activity.priorityContext])}>
                      {activity.priorityContext}
                    </span>
                  </div>

                  <div style={{ color: "var(--muted)", fontSize: 15, marginBottom: 14, lineHeight: 1.65 }}>
                    <div>{activity.description.substring(0, 100)}...</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>TYPE</div>
                      <div style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>{activity.type}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>DURATION</div>
                      <div style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>{activity.duration}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>START DATE</div>
                      <div style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>
                        {new Date(activity.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>
                        SEATS LEFT
                      </div>
                      <div style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>{activity.availableSlots}</div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
