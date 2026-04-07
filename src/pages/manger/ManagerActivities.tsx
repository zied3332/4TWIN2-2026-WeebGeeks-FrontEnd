import React, { useEffect, useMemo, useState } from "react";
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
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);
  const [activitySkills, setActivitySkills] = useState<ActivitySkillRecord[]>([]);

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

  const openActivityDetails = async (activity: ActivityRecord) => {
    setSelectedActivity(activity);
    try {
      const skills = await getActivitySkills(activity._id);
      setActivitySkills(skills);
    } catch (e: any) {
      console.error("Failed to load skills:", e);
      setActivitySkills([]);
    }
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
                style={{
                  ...card,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "start",
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

                <button style={btn} onClick={() => openActivityDetails(activity)}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedActivity && (
        <div
          onClick={() => setSelectedActivity(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.45)",
            zIndex: 110,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(640px, 96vw)", maxHeight: "85vh", overflowY: "auto", ...card }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "var(--text)" }}>
                  {selectedActivity.title}
                </div>
                <div style={{ marginTop: 4, color: "var(--muted)", fontWeight: 700 }}>
                  {selectedActivity.type}
                </div>
              </div>
              <button
                type="button"
                style={btn}
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Description</div>
                <div style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.5 }}>
                  {selectedActivity.description}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Location</div>
                  <div style={{ color: "var(--text)" }}>{selectedActivity.location}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Duration</div>
                  <div style={{ color: "var(--text)" }}>{selectedActivity.duration}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Start Date</div>
                  <div style={{ color: "var(--text)" }}>
                    {new Date(selectedActivity.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>End Date</div>
                  <div style={{ color: "var(--text)" }}>
                    {new Date(selectedActivity.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Status</div>
                  <span style={badge(...statusColors[selectedActivity.status])}>
                    {formatStatus(selectedActivity.status)}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Context</div>
                  <span style={badge(...contextColors[selectedActivity.priorityContext])}>
                    {selectedActivity.priorityContext}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Priority Level</div>
                  <div style={{ color: "var(--text)" }}>{formatLevel(selectedActivity.targetLevel)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Seats Available</div>
                  <div style={{ color: "var(--text)" }}>{selectedActivity.availableSlots}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Department</div>
                  <div style={{ color: "var(--text)" }}>
                    {departmentNameById.get(selectedActivity.departmentId || "") || "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Responsible Manager</div>
                  <div style={{ color: "var(--text)" }}>
                    {managerNameById.get(selectedActivity.responsibleManagerId || "") || "Unassigned"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Created At</div>
                <div style={{ color: "var(--text)" }}>
                  {selectedActivity.createdAt
                    ? new Date(selectedActivity.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>

              {activitySkills.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>Required Skills</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {activitySkills.map((as: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          borderLeft: "3px solid color-mix(in srgb, var(--primary) 55%, var(--border))",
                          paddingLeft: 12,
                          color: "var(--text)",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{as.skill_id.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          Level: <span style={{ fontWeight: 700 }}>{as.required_level}</span> | Importance:{" "}
                          <span style={{ fontWeight: 700 }}>{(as.weight * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button style={{ ...btn, flex: 1 }} onClick={() => setSelectedActivity(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
