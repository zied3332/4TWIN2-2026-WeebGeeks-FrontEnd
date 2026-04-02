import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getActivityParticipations,
  listActivities,
  updateParticipationStatus,
  type ActivityParticipationRecord,
  type ActivityRecord,
} from "../../services/activities.service";

type Row = {
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

export default function ManagerApprovals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const me = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const managerDepartmentId = useMemo(() => String(me?.department || ""), [me]);

  const pending = useMemo(() => rows.filter((r) => r.participation.status === "ENROLLED"), [rows]);
  const accepted = useMemo(() => rows.filter((r) => r.participation.status === "APPROVED"), [rows]);
  const denied = useMemo(() => rows.filter((r) => r.participation.status === "REJECTED"), [rows]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const activities = await listActivities();
        const deptActivities = activities.filter((a) => String(a.departmentId || "") === managerDepartmentId);

        const settled = await Promise.allSettled(
          deptActivities.map(async (activity) => {
            const participations = await getActivityParticipations(activity._id, "ALL");
            return participations.map((p) => ({ activity, participation: p } as Row));
          }),
        );

        const collected = settled
          .filter((x): x is PromiseFulfilledResult<Row[]> => x.status === "fulfilled")
          .flatMap((x) => x.value)
          .sort((a, b) => {
            const aTime = new Date(a.participation.createdAt || 0).getTime();
            const bTime = new Date(b.participation.createdAt || 0).getTime();
            return bTime - aTime;
          });

        setRows(collected);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load approvals.");
      } finally {
        setLoading(false);
      }
    };

    if (managerDepartmentId) {
      void load();
    } else {
      setLoading(false);
      setRows([]);
      setError("Your manager account has no department assigned.");
    }
  }, [managerDepartmentId]);

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
      setError(e instanceof Error ? e.message : "Failed to update request.");
    } finally {
      setBusyKey("");
    }
  };

  const renderRows = (list: Row[], canDecide: boolean) => {
    if (!list.length) {
      return (
        <div style={{ ...card, textAlign: "center", color: "#64748b" }}>
          No requests in this status.
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 12 }}>
        {list.map((row) => {
          const employee = row.participation.employee;
          const employeeName = String(employee?.name || row.participation.employeeId || "Employee");
          const employeeEmail = String(employee?.email || "");
          const approveKey = `${row.activity._id}:${row.participation.employeeId}:APPROVED`;
          const rejectKey = `${row.activity._id}:${row.participation.employeeId}:REJECTED`;

          return (
            <div key={`${row.activity._id}-${row.participation.employeeId}`} style={card}>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{row.activity.title}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{row.activity.type} • {row.activity.location}</div>
                <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{employeeName}</div>
                  <div style={{ color: "#64748b", marginTop: 2 }}>{employeeEmail || "No email"}</div>
                </div>

                {canDecide && (
                  <div style={{ display: "flex", gap: 8 }}>
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
          <h1 style={{ marginBottom: 0 }}>Approvals</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Review requests from employees in your department.
          </p>
        </div>

        {error && (
          <div style={{ ...card, background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b", marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...card, textAlign: "center", color: "#64748b" }}>Loading requests...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#92400e" }}>Pending ({pending.length})</h3>
              {renderRows(pending, true)}
            </div>
            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#166534" }}>Accepted ({accepted.length})</h3>
              {renderRows(accepted, false)}
            </div>
            <div>
              <h3 style={{ margin: "4px 0 10px", color: "#991b1b" }}>Denied ({denied.length})</h3>
              {renderRows(denied, false)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}