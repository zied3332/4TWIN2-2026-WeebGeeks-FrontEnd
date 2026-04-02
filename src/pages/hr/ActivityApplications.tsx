import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getActivityParticipations,
  listActivities,
  updateParticipationStatus,
  type ActivityParticipationRecord,
  type ActivityRecord,
} from "../../services/activities.service";

type ActivityApplicationsRow = {
  activity: ActivityRecord;
  participation: ActivityParticipationRecord;
};

const card: CSSProperties = {
  background: "white",
  border: "1px solid #eaecef",
  borderRadius: 12,
  padding: 16,
};

const btn: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #eaecef",
  background: "white",
  fontWeight: 800,
  cursor: "pointer",
};

export default function ActivityApplications() {
  const [rows, setRows] = useState<ActivityApplicationsRow[]>([]);
  const [activitiesById, setActivitiesById] = useState<Record<string, ActivityRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const waitingRows = useMemo(() => rows.filter((r) => r.participation.status === "ENROLLED"), [rows]);
  const acceptedRows = useMemo(() => rows.filter((r) => r.participation.status === "APPROVED"), [rows]);
  const deniedRows = useMemo(() => rows.filter((r) => r.participation.status === "REJECTED"), [rows]);

  const approvedCountByActivity = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((row) => {
      if (row.participation.status === "APPROVED" || row.participation.status === "COMPLETED") {
        map[row.activity._id] = (map[row.activity._id] || 0) + 1;
      }
    });
    return map;
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const activities = await listActivities();
      setActivitiesById(Object.fromEntries(activities.map((a) => [a._id, a])));
      const settled = await Promise.allSettled(
        activities.map(async (activity) => {
          const participations = await getActivityParticipations(activity._id, "ALL");
          return participations.map((participation) => ({ activity, participation }));
        }),
      );

      const collected = settled
        .filter((item): item is PromiseFulfilledResult<ActivityApplicationsRow[]> => item.status === "fulfilled")
        .flatMap((item) => item.value)
        .sort((a, b) => {
          const aTime = new Date(a.participation.createdAt || 0).getTime();
          const bTime = new Date(b.participation.createdAt || 0).getTime();
          return bTime - aTime;
        });

      setRows(collected);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const decide = async (activityId: string, employeeId: string, decision: "APPROVED" | "REJECTED") => {
    const key = `${activityId}:${employeeId}:${decision}`;
    setBusyKey(key);
    setError("");
    try {
      await updateParticipationStatus(activityId, employeeId, decision);
      setRows((prev) =>
        prev.map((row) => {
          if (row.activity._id !== activityId) return row;
          if (row.participation.employeeId !== employeeId) return row;
          return {
            ...row,
            participation: {
              ...row.participation,
              status: decision,
            },
          };
        }),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update application.");
    } finally {
      setBusyKey("");
    }
  };

  const renderRows = (list: ActivityApplicationsRow[], canDecide: boolean) => {
    if (!list.length) {
      return (
        <div style={{ ...card, textAlign: "center", color: "#64748b" }}>
          No requests in this status.
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 14 }}>
        {list.map((row) => {
          const employee = row.participation.employee;
          const employeeName = String(employee?.name || row.participation.employeeId || "Employee");
          const employeeEmail = String(employee?.email || "");
          const approveKey = `${row.activity._id}:${row.participation.employeeId}:APPROVED`;
          const rejectKey = `${row.activity._id}:${row.participation.employeeId}:REJECTED`;
          const activity = activitiesById[row.activity._id] || row.activity;
          const approvedCount = approvedCountByActivity[row.activity._id] || 0;
          const seatsLeft = Math.max(0, Number(activity.availableSlots || 0) - approvedCount);

          return (
            <div key={`${row.activity._id}-${row.participation.employeeId}`} style={card}>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>{row.activity.title}</div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontWeight: 800,
                      fontSize: 12,
                      background: "rgba(16,185,129,0.12)",
                      color: "#065f46",
                      border: "1px solid rgba(16,185,129,0.24)",
                    }}
                  >
                    Seats Left: {seatsLeft}
                  </div>
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {row.activity.type} • {row.activity.location}
                </div>

                <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{employeeName}</div>
                  <div style={{ color: "#64748b", marginTop: 2 }}>{employeeEmail || "No email"}</div>
                  <div style={{ color: "#64748b", marginTop: 4, fontSize: 12 }}>
                    Applied on {row.participation.createdAt ? new Date(row.participation.createdAt).toLocaleString() : "-"}
                  </div>
                </div>

                {canDecide && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={{ ...btn, border: "1px solid rgba(22,163,74,0.35)", color: "#166534", background: "rgba(22,163,74,0.1)" }}
                      disabled={busyKey === approveKey || busyKey === rejectKey}
                      onClick={() => decide(row.activity._id, row.participation.employeeId, "APPROVED")}
                    >
                      {busyKey === approveKey ? "Accepting..." : "Accept"}
                    </button>

                    <button
                      type="button"
                      style={{ ...btn, border: "1px solid rgba(239,68,68,0.35)", color: "#991b1b", background: "rgba(239,68,68,0.08)" }}
                      disabled={busyKey === approveKey || busyKey === rejectKey}
                      onClick={() => decide(row.activity._id, row.participation.employeeId, "REJECTED")}
                    >
                      {busyKey === rejectKey ? "Denying..." : "Deny"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ marginBottom: 0 }}>Activity Applications</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Review employee applications and approve or deny requests.
          </p>
        </div>

        {error && (
          <div style={{ ...card, background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...card, textAlign: "center", color: "#64748b" }}>Loading applications...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid #eaecef", flexWrap: "wrap" }}>
                <span style={{ borderRadius: 999, padding: "6px 10px", fontWeight: 800, fontSize: 12, background: "rgba(245,158,11,0.15)", color: "#92400e" }}>
                  Pending ({waitingRows.length})
                </span>
                <span style={{ borderRadius: 999, padding: "6px 10px", fontWeight: 800, fontSize: 12, background: "rgba(22,163,74,0.12)", color: "#166534" }}>
                  Accepted ({acceptedRows.length})
                </span>
                <span style={{ borderRadius: 999, padding: "6px 10px", fontWeight: 800, fontSize: 12, background: "rgba(239,68,68,0.12)", color: "#991b1b" }}>
                  Denied ({deniedRows.length})
                </span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#92400e" }}>Pending</h3>
              {renderRows(waitingRows, true)}
            </div>

            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#166534" }}>Accepted</h3>
              {renderRows(acceptedRows, false)}
            </div>

            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#991b1b" }}>Denied</h3>
              {renderRows(deniedRows, false)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
