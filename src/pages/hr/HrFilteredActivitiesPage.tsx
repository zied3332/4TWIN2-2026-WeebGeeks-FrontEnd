import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCalendar, FiSlash, FiUsers } from "react-icons/fi";
import {
  listActivities,
  cancelActivityById,
  type ActivityRecord,
  type ListActivitiesQuery,
} from "../../services/activities.service";

const META: Record<
  NonNullable<ListActivitiesQuery["hrView"]>,
  { title: string; subtitle: string }
> = {
  pipeline: {
    title: "Staffing & validation",
    subtitle:
      "Activities where HR used recommendations, finalized the shortlist, and sent it to the manager — through invitations and launch. Open one to continue HR work. Cancel is available for activities that are already in progress.",
  },
  completed: {
    title: "Completed activities",
    subtitle:
      "Activities that ran and passed their end date. Read-only archive for reference.",
  },
};

function formatLabel(v: string) {
  return v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
}

function HrFilteredActivitiesInner({ mode }: { mode: NonNullable<ListActivitiesQuery["hrView"]> }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listActivities({ hrView: mode });
      setItems(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listActivities({ hrView: mode });
        if (!cancelled) setItems(data || []);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load activities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    return copy;
  }, [items]);

  const page = META[mode];

  const onConfirmCancel = async () => {
    if (!cancelConfirmId) return;
    setCancelling(true);
    setError("");
    try {
      await cancelActivityById(cancelConfirmId);
      setCancelConfirmId(null);
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not cancel activity.");
    } finally {
      setCancelling(false);
    }
  };

  const showCancelOnRow = mode === "pipeline";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="page-header" style={{ marginBottom: "20px" }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {page.title}
          </h1>
          <p className="page-subtitle" style={{ maxWidth: "720px", marginTop: "8px" }}>
            {page.subtitle}
          </p>
        </div>

        {error ? (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              border: "1px solid #fecaca",
              background: "rgba(239,68,68,0.08)",
              color: "#b91c1c",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ color: "var(--muted)", padding: "40px 0" }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--muted)",
              border: "1px dashed var(--border)",
              borderRadius: "16px",
              background: "var(--surface-2)",
            }}
          >
            No activities in this list yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sorted.map((a) => (
              <div
                key={a._id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "stretch",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/hr/activities/${a._id}/staffing`)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text)",
                    padding: 0,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "17px", marginBottom: "6px" }}>{a.title}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600 }}>
                    {formatLabel(a.type)} · {formatLabel(a.status)}
                    {a.workflowStatus ? ` · ${formatLabel(a.workflowStatus)}` : ""}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "14px",
                      fontSize: "13px",
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiCalendar size={14} /> {a.startDate} → {a.endDate}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiUsers size={14} /> {a.availableSlots} seats
                    </span>
                  </div>
                </button>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "10px",
                    flexShrink: 0,
                  }}
                >
                  {showCancelOnRow && a.status === "IN_PROGRESS" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelConfirmId(a._id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        border: "1px solid #fcd34d",
                        background: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <FiSlash size={14} /> Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Open staffing"
                    onClick={() => navigate(`/hr/activities/${a._id}/staffing`)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "4px",
                      color: "var(--primary, #10b981)",
                    }}
                  >
                    <FiArrowRight size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelConfirmId ? (
        <div
          onClick={() => !cancelling && setCancelConfirmId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 110,
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(440px, 96vw)",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
              borderLeft: "4px solid #d97706",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "18px", color: "#92400e", marginBottom: "12px" }}>
              Cancel activity?
            </div>
            <div style={{ color: "var(--muted)", marginBottom: "20px", lineHeight: 1.5 }}>
              This marks the activity as cancelled. Use for in-progress activities that should not continue.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelling}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontWeight: 700,
                  cursor: cancelling ? "not-allowed" : "pointer",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void onConfirmCancel()}
                disabled={cancelling}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#92400e",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: cancelling ? "not-allowed" : "pointer",
                }}
              >
                {cancelling ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HrStaffingPipelinePage() {
  return <HrFilteredActivitiesInner mode="pipeline" />;
}

export function HrCompletedActivitiesPage() {
  return <HrFilteredActivitiesInner mode="completed" />;
}
