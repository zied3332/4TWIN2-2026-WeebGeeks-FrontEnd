import { useMemo, useState } from "react";
import "./HrCopilotPage.css";
import type { ActivityItem, CandidateItem } from "../../types/hr-copilot";
import {
  explainCandidate,
  getCandidates,
  searchActivities,
} from "../../services/hrCopilot.service";

export default function HrCopilotPage() {
  const [query, setQuery] = useState("List IT activities for backend developers");
  const [lastPrompt, setLastPrompt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null
  );
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateItem | null>(null);
  const [explanation, setExplanation] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [showActivitiesPanel, setShowActivitiesPanel] = useState(true);
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);

  const quickPrompts = [
    "List cloud training activities",
    "Find backend upskilling activities",
    "Search AI certifications for data team",
    "Show DevOps activities from this quarter",
  ];

  const stageLabel = useMemo(() => {
    if (loadingSearch) return "Searching activities";
    if (loadingCandidates) return "Ranking candidates";
    if (loadingExplanation) return "Generating explanation";
    if (selectedCandidate && explanation.length > 0) return "Explanation ready";
    if (selectedActivity && candidates.length > 0) return "Candidates ready";
    if (activities.length > 0) return "Activities found";
    return "Ready";
  }, [
    loadingSearch,
    loadingCandidates,
    loadingExplanation,
    selectedCandidate,
    explanation.length,
    selectedActivity,
    candidates.length,
    activities.length,
  ]);

  const handleSearch = async () => {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) {
      setError("Please enter a request first.");
      return;
    }

    try {
      setError("");
      setLoadingSearch(true);
      setLastPrompt(cleanedQuery);

      setSelectedActivity(null);
      setCandidates([]);
      setSelectedCandidate(null);
      setExplanation([]);

      const response = await searchActivities(cleanedQuery, sessionId || undefined);

      const nextSessionId =
        response.sessionId || response.sessionState?.sessionId || "";
      if (nextSessionId) {
        setSessionId(nextSessionId);
      }

      const rawActivities = Array.isArray(response.data?.activities)
        ? response.data.activities
        : Array.isArray(response.data)
        ? response.data
        : [];

      const normalizedActivities: ActivityItem[] = rawActivities.map(
        (activity: any) => ({
          id: activity.id || activity._id || "",
          title: activity.title || "Untitled activity",
          type: activity.type || "",
          domain: activity.domain || activity.category || "",
          description: activity.description || activity.objective || "",
          score: activity.score,
        })
      );

      setActivities(normalizedActivities);
      setShowActivitiesPanel(true);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err?.response?.data?.message || "Failed to search activities.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectActivity = async (activity: ActivityItem) => {
    try {
      setError("");
      setLoadingCandidates(true);
      setSelectedActivity(activity);
      setSelectedCandidate(null);
      setExplanation([]);
      setShowDetailsPanel(true);

      const data = await getCandidates(activity.id, 5);
      setCandidates(data.candidates || []);
    } catch (err: any) {
      console.error("Candidates error:", err);
      setError(err?.response?.data?.message || "Failed to load candidates.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleExplain = async (candidate: CandidateItem) => {
    if (!selectedActivity) {
      setError("Please select an activity before asking for an explanation.");
      return;
    }

    try {
      setError("");
      setLoadingExplanation(true);
      setSelectedCandidate(candidate);
      setShowDetailsPanel(true);

      const data = await explainCandidate(
        selectedActivity.id,
        candidate.employeeId
      );

      setExplanation(data.explanation || []);
    } catch (err: any) {
      console.error("Explanation error:", err);
      setError(err?.response?.data?.message || "Failed to load explanation.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleResetSelection = () => {
    setSelectedActivity(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setExplanation([]);
  };

  const mainWorkspaceClass = [
    "copilot-workspace",
    showActivitiesPanel ? "" : "hide-left-panel",
    showDetailsPanel ? "" : "hide-right-panel",
  ]
    .join(" ")
    .trim();

  return (
    <div className="hr-copilot-page">
      <div className="copilot-shell">
        <div className="copilot-topbar">
          <div className="topbar-left">
            <div className="copilot-app-mark">AI</div>
            <div>
              <h1>HR Copilot</h1>
              <p>AI-assisted activity search, ranking, and explanation workspace</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-status">
              <span className="status-dot" />
              {stageLabel}
            </div>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowActivitiesPanel((prev) => !prev)}
            >
              {showActivitiesPanel ? "Hide activities" : "Show activities"}
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowDetailsPanel((prev) => !prev)}
            >
              {showDetailsPanel ? "Hide details" : "Show details"}
            </button>
          </div>
        </div>

        <div className="copilot-searchbar">
          <div className="searchbox">
            <span className="searchbox-icon">⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the HR Copilot something..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>

          <button
            type="button"
            className="search-btn"
            onClick={handleSearch}
            disabled={loadingSearch}
          >
            {loadingSearch ? "Searching..." : "Run search"}
          </button>
        </div>

        <div className="quick-prompt-row">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="quick-prompt"
              onClick={() => setQuery(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {error ? <div className="copilot-error">{error}</div> : null}

        <div className="copilot-metrics">
          <div className="metric-card">
            <span>Activities</span>
            <strong>{activities.length}</strong>
          </div>
          <div className="metric-card">
            <span>Candidates</span>
            <strong>{candidates.length}</strong>
          </div>
          <div className="metric-card">
            <span>Session</span>
            <strong>{sessionId ? "Active" : "New"}</strong>
          </div>
          <div className="metric-card">
            <span>Selected</span>
            <strong>{selectedCandidate ? "Candidate" : selectedActivity ? "Activity" : "None"}</strong>
          </div>
        </div>

        <div className={mainWorkspaceClass}>
          {showActivitiesPanel ? (
            <aside className="workspace-panel left-panel">
              <div className="panel-toolbar">
                <div>
                  <h2>Activities</h2>
                  <p>Search results and matching items</p>
                </div>
                <span className="panel-pill">{activities.length}</span>
              </div>

              <div className="panel-scroll">
                {loadingSearch ? (
                  <div className="empty-card">
                    <div className="empty-title">Searching activities...</div>
                    <p>The copilot is looking for relevant matching activities.</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="empty-card">
                    <div className="empty-title">No activities yet</div>
                    <p>Try prompts like “backend training”, “cloud certification”, or “AI upskilling”.</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <button
                      key={activity.id}
                      type="button"
                      className={`activity-list-card ${
                        selectedActivity?.id === activity.id ? "is-active" : ""
                      }`}
                      onClick={() => handleSelectActivity(activity)}
                    >
                      <div className="list-card-top">
                        <span className="list-index">{String(index + 1).padStart(2, "0")}</span>
                        {activity.type ? <span className="soft-badge">{activity.type}</span> : null}
                      </div>

                      <h3>{activity.title}</h3>
                      <p>{activity.description || "No description available."}</p>

                      <div className="list-card-meta">
                        {activity.domain ? (
                          <span className="mini-pill">{activity.domain}</span>
                        ) : null}
                        {typeof activity.score === "number" ? (
                          <span className="mini-pill">Score {activity.score}</span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>
          ) : null}

          <main className="workspace-main">
            <div className="conversation-header">
              <div>
                <span className="section-kicker">Copilot session</span>
                <h2>Recommendation Workspace</h2>
              </div>

              {(selectedActivity || selectedCandidate) && (
                <button
                  type="button"
                  className="ghost-btn danger-ghost"
                  onClick={handleResetSelection}
                >
                  Reset selection
                </button>
              )}
            </div>

            <div className="conversation-body">
              {lastPrompt ? (
                <div className="message-row user-row">
                  <div className="message-bubble user-bubble">
                    <span className="message-label">Your request</span>
                    <p>{lastPrompt}</p>
                  </div>
                </div>
              ) : (
                <div className="intro-card">
                  <span className="section-kicker">Start here</span>
                  <h3>Ask for activities, then select one to get recommended candidates</h3>
                  <p>
                    This space is designed to feel like a working session instead of a static dashboard.
                    Search first, choose an activity, then open ranking explanations on the right.
                  </p>
                </div>
              )}

              <div className="message-row assistant-row">
                <div className="message-bubble assistant-bubble">
                  <span className="message-label">Copilot status</span>
                  <p>
                    {loadingSearch
                      ? "Searching for relevant activities..."
                      : loadingCandidates
                      ? "Analyzing top matching employees for the selected activity..."
                      : loadingExplanation
                      ? "Preparing an explanation for the selected candidate..."
                      : selectedCandidate && explanation.length > 0
                      ? "Explanation is ready. You can review it in the details panel."
                      : selectedActivity
                      ? "Activity selected. Review the ranked candidates below."
                      : activities.length > 0
                      ? "Activities found. Select one from the left panel."
                      : "Waiting for your first request."}
                  </p>
                </div>
              </div>

              {selectedActivity ? (
                <section className="workspace-focus-card">
                  <div className="focus-card-head">
                    <div>
                      <span className="section-kicker">Selected activity</span>
                      <h3>{selectedActivity.title}</h3>
                    </div>
                    <button
                      type="button"
                      className="icon-close-btn"
                      onClick={() => {
                        setSelectedActivity(null);
                        setCandidates([]);
                        setSelectedCandidate(null);
                        setExplanation([]);
                      }}
                      aria-label="Close selected activity"
                    >
                      ×
                    </button>
                  </div>

                  <p>{selectedActivity.description || "No description available."}</p>

                  <div className="focus-meta">
                    {selectedActivity.type ? (
                      <span className="mini-pill">{selectedActivity.type}</span>
                    ) : null}
                    {selectedActivity.domain ? (
                      <span className="mini-pill">{selectedActivity.domain}</span>
                    ) : null}
                    {typeof selectedActivity.score === "number" ? (
                      <span className="mini-pill">Relevance {selectedActivity.score}</span>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="candidate-stream">
                <div className="stream-header">
                  <div>
                    <span className="section-kicker">Candidate ranking</span>
                    <h3>Top matched employees</h3>
                  </div>
                  <span className="panel-pill">{candidates.length}</span>
                </div>

                {!selectedActivity ? (
                  <div className="empty-card large-empty">
                    <div className="empty-title">No activity selected</div>
                    <p>Choose one activity from the left panel to generate ranked candidates.</p>
                  </div>
                ) : loadingCandidates ? (
                  <div className="candidate-skeleton-list">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="candidate-skeleton-card" />
                    ))}
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="empty-card large-empty">
                    <div className="empty-title">No candidates found</div>
                    <p>Try another activity or broaden your request.</p>
                  </div>
                ) : (
                  candidates.map((candidate, index) => (
                    <div
                      key={candidate.employeeId}
                      className={`candidate-thread-card ${
                        selectedCandidate?.employeeId === candidate.employeeId
                          ? "is-active"
                          : ""
                      }`}
                    >
                      <div className="thread-main">
                        <div className="thread-avatar">
                          {candidate.name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="thread-content">
                          <div className="thread-headline">
                            <div>
                              <h4>{candidate.name}</h4>
                              <span className="rank-label">Rank #{index + 1}</span>
                            </div>
                            <div className="thread-score">{candidate.finalScore}/100</div>
                          </div>

                          <p>{candidate.shortReason}</p>

                          <div className="thread-scores">
                            <span>Semantic <strong>{candidate.semanticScore}</strong></span>
                            <span>Skills <strong>{candidate.skillScore}</strong></span>
                            <span>Progression <strong>{candidate.progressionScore}</strong></span>
                            <span>Experience <strong>{candidate.experienceScore}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="thread-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          Open profile
                        </button>

                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => handleExplain(candidate)}
                        >
                          {loadingExplanation &&
                          selectedCandidate?.employeeId === candidate.employeeId
                            ? "Explaining..."
                            : "Explain ranking"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          </main>

          {showDetailsPanel ? (
            <aside className="workspace-panel right-panel">
              <div className="panel-toolbar">
                <div>
                  <h2>Details</h2>
                  <p>Explanation and current context</p>
                </div>
                <button
                  type="button"
                  className="icon-close-btn"
                  onClick={() => setShowDetailsPanel(false)}
                  aria-label="Close details panel"
                >
                  ×
                </button>
              </div>

              <div className="panel-scroll">
                {selectedCandidate ? (
                  <div className="detail-profile-card">
                    <div className="profile-avatar">
                      {selectedCandidate.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h3>{selectedCandidate.name}</h3>
                    <p>Top ranked recommendation for the selected activity</p>
                    <div className="profile-score">{selectedCandidate.finalScore}/100</div>
                  </div>
                ) : (
                  <div className="empty-card">
                    <div className="empty-title">No candidate selected</div>
                    <p>Select a candidate to open more details here.</p>
                  </div>
                )}

                {selectedActivity ? (
                  <div className="details-section">
                    <div className="details-section-title">Selected activity</div>
                    <div className="details-chip-row">
                      <span className="mini-pill">{selectedActivity.title}</span>
                      {selectedActivity.type ? (
                        <span className="mini-pill">{selectedActivity.type}</span>
                      ) : null}
                      {selectedActivity.domain ? (
                        <span className="mini-pill">{selectedActivity.domain}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="details-section">
                  <div className="details-section-title">Explanation</div>

                  {loadingExplanation ? (
                    <div className="empty-card">
                      <div className="empty-title">Generating explanation...</div>
                      <p>The copilot is preparing a ranking summary.</p>
                    </div>
                  ) : explanation.length === 0 ? (
                    <div className="empty-card">
                      <div className="empty-title">No explanation yet</div>
                      <p>Click “Explain ranking” on a candidate card to open a detailed reasoning panel.</p>
                    </div>
                  ) : (
                    <div className="explanation-card">
                      <div className="explanation-card-head">
                        <span className="section-kicker">AI explanation</span>
                        {selectedCandidate ? (
                          <span className="explanation-score">
                            {selectedCandidate.finalScore}/100
                          </span>
                        ) : null}
                      </div>

                      <ul className="explanation-list">
                        {explanation.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}