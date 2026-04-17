import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listActivities,
  type ActivityRecord,
} from "../../services/activities.service";

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
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

const contextColors: Record<string, [string, string]> = {
  UPSKILLING: ["color-mix(in srgb, var(--surface-2) 78%, #bae6fd)", "color-mix(in srgb, var(--text) 84%, #0369a1)"],
  EXPERTISE: ["color-mix(in srgb, var(--surface-2) 78%, #fde68a)", "color-mix(in srgb, var(--text) 84%, #b45309)"],
  DEVELOPMENT: ["color-mix(in srgb, var(--surface-2) 78%, #ddd6fe)", "color-mix(in srgb, var(--text) 84%, #6d28d9)"],
};

export default function ManagerActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listActivities();
        setActivities(data || []);
      } catch (e) {
        console.error("Failed to load activities:", e);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
            <h1 className="page-title">My activities</h1>
            <p className="page-subtitle" style={{ maxWidth: 720 }}>
              Only activities where HR has already sent you the shortlist and details. For in-progress or past
              activities, use the sidebar.
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "var(--muted)", padding: 40 }}>
            <p>Nothing here yet. When HR sends a participant list to you, it will appear in this list.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {activities.map((activity) => (
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
                    <div>
                      {(activity.description || "").length > 100
                        ? `${(activity.description || "").slice(0, 100)}…`
                        : activity.description || "—"}
                    </div>
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
