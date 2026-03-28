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
  background: "white",
  border: "1px solid #eaecef",
  borderRadius: 12,
  padding: 16,
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #eaecef",
  background: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: bg,
  color,
  fontWeight: 900,
  fontSize: 12,
});

const statusColors: Record<string, [string, string]> = {
  PLANNED: ["#eef2ff", "#3730a3"],
  IN_PROGRESS: ["#dcfce7", "#15803d"],
  COMPLETED: ["#f0fdf4", "#166534"],
  CANCELLED: ["#fee2e2", "#991b1b"],
};

const contextColors: Record<string, [string, string]> = {
  UPSKILLING: ["#e0f2fe", "#0369a1"],
  EXPERTISE: ["#fef3c7", "#f59e0b"],
  DEVELOPMENT: ["#f3e8ff", "#7c3aed"],
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 0 }}>Department Activities</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Activities for your department team members
          </p>
        </div>

        {filteredActivities.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "#a3a3a3", padding: 40 }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
                      {activity.title}
                    </div>
                    <span style={badge(...contextColors[activity.priorityContext])}>
                      {activity.priorityContext}
                    </span>
                  </div>

                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                    <div>{activity.description.substring(0, 100)}...</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a3a3", marginBottom: 2 }}>TYPE</div>
                      <div style={{ color: "#475569" }}>{activity.type}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a3a3", marginBottom: 2 }}>DURATION</div>
                      <div style={{ color: "#475569", fontSize: 12 }}>{activity.duration}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a3a3", marginBottom: 2 }}>START DATE</div>
                      <div style={{ color: "#475569", fontSize: 12 }}>
                        {new Date(activity.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a3a3", marginBottom: 2 }}>
                        SEATS LEFT
                      </div>
                      <div style={{ color: "#475569" }}>{activity.availableSlots}</div>
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
                <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                  {selectedActivity.title}
                </div>
                <div style={{ marginTop: 4, color: "#64748b", fontWeight: 700 }}>
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
                <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Description</div>
                <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
                  {selectedActivity.description}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Location</div>
                  <div style={{ color: "#475569" }}>{selectedActivity.location}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Duration</div>
                  <div style={{ color: "#475569" }}>{selectedActivity.duration}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Start Date</div>
                  <div style={{ color: "#475569" }}>
                    {new Date(selectedActivity.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>End Date</div>
                  <div style={{ color: "#475569" }}>
                    {new Date(selectedActivity.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Status</div>
                  <span style={badge(...statusColors[selectedActivity.status])}>
                    {formatStatus(selectedActivity.status)}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Context</div>
                  <span style={badge(...contextColors[selectedActivity.priorityContext])}>
                    {selectedActivity.priorityContext}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Priority Level</div>
                  <div style={{ color: "#475569" }}>{formatLevel(selectedActivity.targetLevel)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Seats Available</div>
                  <div style={{ color: "#475569" }}>{selectedActivity.availableSlots}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Department</div>
                  <div style={{ color: "#475569" }}>
                    {departmentNameById.get(selectedActivity.departmentId || "") || "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Responsible Manager</div>
                  <div style={{ color: "#475569" }}>
                    {managerNameById.get(selectedActivity.responsibleManagerId || "") || "Unassigned"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Created At</div>
                <div style={{ color: "#475569" }}>
                  {selectedActivity.createdAt
                    ? new Date(selectedActivity.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>

              {activitySkills.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Required Skills</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {activitySkills.map((as: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          borderLeft: "3px solid #e0f2fe",
                          paddingLeft: 12,
                          color: "#475569",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{as.skill_id.name}</div>
                        <div style={{ fontSize: 11, color: "#a3a3a3", marginTop: 2 }}>
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
