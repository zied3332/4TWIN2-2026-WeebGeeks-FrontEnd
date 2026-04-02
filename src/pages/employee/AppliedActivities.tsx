import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getActivityParticipations,
  listActivities,
  type ActivityParticipationRecord,
  type ActivityRecord,
  type ParticipationStatus,
} from "../../services/activities.service";

type ApplicationRow = {
  activity: ActivityRecord;
  participation: ActivityParticipationRecord;
};

const card: CSSProperties = {
  background: "white",
  border: "1px solid #eaecef",
  borderRadius: 12,
  padding: 16,
};

function statusLabel(status: ParticipationStatus) {
  if (status === "ENROLLED") return "Waiting";
  if (status === "APPROVED") return "Accepted";
  if (status === "REJECTED") return "Denied";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

function statusTone(status: ParticipationStatus): React.CSSProperties {
  if (status === "ENROLLED") {
    return { background: "rgba(245,158,11,0.14)", color: "#92400e", border: "1px solid rgba(245,158,11,0.3)" };
  }
  if (status === "APPROVED") {
    return { background: "rgba(22,163,74,0.12)", color: "#166534", border: "1px solid rgba(22,163,74,0.3)" };
  }
  if (status === "REJECTED") {
    return { background: "rgba(239,68,68,0.12)", color: "#991b1b", border: "1px solid rgba(239,68,68,0.3)" };
  }
  return { background: "rgba(100,116,139,0.12)", color: "#334155", border: "1px solid rgba(100,116,139,0.3)" };
}

export default function AppliedActivities() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const currentEmployeeId = useMemo(() => {
    return (
      String(currentUser?.employeeId || "") ||
      String(currentUser?._id || "") ||
      String(currentUser?.id || "")
    );
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const activities = await listActivities();
        const settled = await Promise.allSettled(
          activities.map(async (activity) => {
            const participations = await getActivityParticipations(activity._id);
            const own = participations.find((p) => p.employeeId === currentEmployeeId);
            if (!own) return null;
            return { activity, participation: own } as ApplicationRow;
          }),
        );

        const collected = settled
          .filter((item): item is PromiseFulfilledResult<ApplicationRow | null> => item.status === "fulfilled")
          .map((item) => item.value)
          .filter((item): item is ApplicationRow => !!item)
          .sort((a, b) => {
            const aTime = new Date(a.participation.createdAt || 0).getTime();
            const bTime = new Date(b.participation.createdAt || 0).getTime();
            return bTime - aTime;
          });

        setRows(collected);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load your applications.");
      } finally {
        setLoading(false);
      }
    };

    if (currentEmployeeId) {
      void load();
    } else {
      setLoading(false);
      setError("Could not identify current employee.");
    }
  }, [currentEmployeeId]);

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ marginBottom: 0 }}>My Applications</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Track all activity applications and their decisions.
          </p>
        </div>

        {error && (
          <div style={{ ...card, background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...card, textAlign: "center", color: "#64748b" }}>Loading your applications...</div>
        ) : rows.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "#64748b" }}>
            You have not applied to any activity yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {rows.map(({ activity, participation }) => (
              <div key={`${activity._id}-${participation.employeeId}`} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>{activity.title}</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>{activity.type} • {activity.location}</div>
                  </div>
                  <span
                    style={{
                      ...statusTone(participation.status),
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {statusLabel(participation.status)}
                  </span>
                </div>

                <div style={{ marginTop: 10, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                  <div>Applied on: {participation.createdAt ? new Date(participation.createdAt).toLocaleString() : "-"}</div>
                  <div>Start: {new Date(activity.startDate).toLocaleDateString()} • End: {new Date(activity.endDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
