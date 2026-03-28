const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type ActivityType = "TRAINING" | "CERTIFICATION" | "PROJECT" | "MISSION" | "AUDIT";
export type SkillType = "KNOWLEDGE" | "KNOW_HOW" | "SOFT";
export type DesiredLevel = "LOW" | "MEDIUM" | "HIGH";
export type PriorityContext = "UPSKILLING" | "EXPERTISE" | "DEVELOPMENT";
export type ActivityStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RequiredSkill = {
  name: string;
  type: SkillType;
  desiredLevel: DesiredLevel;
};

export type ActivityRecord = {
  _id: string;
  title: string;
  type: ActivityType;
  requiredSkills: RequiredSkill[];
  availableSlots: number;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: ActivityStatus;
  responsibleManagerId?: string;
  departmentId?: string;
  priorityContext: PriorityContext;
  targetLevel: DesiredLevel;
  createdAt: string;
};

export type CreateActivityInput = Omit<ActivityRecord, "_id" | "createdAt">;

function authHeaders() {
  const rawToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  const normalizedToken = String(rawToken || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  return {
    "Content-Type": "application/json",
    ...(normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {}),
  };
}

async function handle(res: Response) {
  const txt = await res.text();
  if (!res.ok) {
    let msg = txt || "Request failed";
    try {
      const parsed = txt ? JSON.parse(txt) : {};
      const raw = Array.isArray(parsed?.message)
        ? parsed.message.join(", ")
        : parsed?.message || parsed?.error;
      if (typeof raw === "string" && raw.trim()) msg = raw;
    } catch {
      // keep fallback message
    }

    if (res.status === 401 || res.status === 403) {
      msg = "Unauthorized session. Please sign out and log in again with your HR account.";
    }

    throw new Error(msg);
  }

  return txt ? JSON.parse(txt) : null;
}

function toId(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return undefined;
}

function mapApiActivity(raw: any): ActivityRecord {
  const toEnum = <T extends string>(value: any, allowed: readonly T[], fallback: T): T => {
    const normalized = String(value || "").toUpperCase() as T;
    return allowed.includes(normalized) ? normalized : fallback;
  };

  const legacyPriority = String(raw?.context_priority || "").toUpperCase();
  const fallbackLevel = ["LOW", "MEDIUM", "HIGH"].includes(legacyPriority)
    ? (legacyPriority as DesiredLevel)
    : "MEDIUM";

  const normalizedStatus = toEnum<ActivityStatus>(
    raw?.status,
    ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const,
    "PLANNED"
  );

  const normalizedContext = toEnum<PriorityContext>(
    raw?.context,
    ["UPSKILLING", "EXPERTISE", "DEVELOPMENT"] as const,
    "DEVELOPMENT"
  );

  const normalizedLevel = toEnum<DesiredLevel>(
    raw?.priority_level || fallbackLevel,
    ["LOW", "MEDIUM", "HIGH"] as const,
    "MEDIUM"
  );

  return {
    _id: String(raw?._id || ""),
    title: String(raw?.title || ""),
    type: String(raw?.type || "TRAINING") as ActivityType,
    requiredSkills: Array.isArray(raw?.requiredSkills) ? raw.requiredSkills : [],
    availableSlots: Number(raw?.seats || 0),
    description: String(raw?.description || ""),
    location: String(raw?.location || ""),
    startDate: String(raw?.startDate || ""),
    endDate: String(raw?.endDate || ""),
    duration: String(raw?.duration || ""),
    status: normalizedStatus,
    responsibleManagerId: toId(raw?.responsible_manager),
    departmentId: toId(raw?.department),
    priorityContext: normalizedContext,
    targetLevel: normalizedLevel,
    createdAt: String(raw?.created_at || raw?.createdAt || ""),
  };
}

export async function listActivities(): Promise<ActivityRecord[]> {
  const res = await fetch(`${BASE}/activities`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await handle(res);
  const arr = Array.isArray(data) ? data : [];
  return arr.map(mapApiActivity);
}

export async function createActivity(input: CreateActivityInput): Promise<ActivityRecord> {
  // Keep frontend-only fields out of payload (requiredSkills) because backend forbids unknown props.
  const payload: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    type: input.type,
    location: input.location,
    startDate: input.startDate,
    endDate: input.endDate,
    duration: input.duration,
    seats: input.availableSlots,
    status: input.status || "PLANNED",
    context: input.priorityContext,
    priority_level: input.targetLevel,
  };

  if (input.responsibleManagerId) payload.responsible_manager = input.responsibleManagerId;
  if (input.departmentId) payload.department = input.departmentId;

  const res = await fetch(`${BASE}/activities`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handle(res);
  return mapApiActivity(data);
}

export async function updateActivityById(
  activityId: string,
  patch: Partial<CreateActivityInput>
): Promise<ActivityRecord> {
  const payload: Record<string, unknown> = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.location !== undefined) payload.location = patch.location;
  if (patch.startDate !== undefined) payload.startDate = patch.startDate;
  if (patch.endDate !== undefined) payload.endDate = patch.endDate;
  if (patch.duration !== undefined) payload.duration = patch.duration;
  if (patch.availableSlots !== undefined) payload.seats = patch.availableSlots;
  if (patch.priorityContext !== undefined) payload.context = patch.priorityContext;
  if (patch.targetLevel !== undefined) payload.priority_level = patch.targetLevel;
  if (patch.status !== undefined) payload.status = patch.status;

  if (patch.responsibleManagerId !== undefined) {
    payload.responsible_manager = patch.responsibleManagerId || null;
  }
  if (patch.departmentId !== undefined) {
    payload.department = patch.departmentId || null;
  }

  const res = await fetch(`${BASE}/activities/${activityId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handle(res);
  return mapApiActivity(data);
}

export async function deleteActivityById(activityId: string): Promise<void> {
  const res = await fetch(`${BASE}/activities/${activityId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handle(res);
}

// ==================== Activity Skills ====================

export type ActivitySkillRecord = {
  _id: string;
  activity_id: string;
  skill_id: {
    _id: string;
    name: string;
    category: string;
    description: string;
  };
  required_level: "LOW" | "MEDIUM" | "HIGH" | "EXPERT";
  weight: number;
};

export async function addSkillToActivity(
  activityId: string,
  skillId: string,
  requiredLevel: "LOW" | "MEDIUM" | "HIGH" | "EXPERT" = "MEDIUM",
  weight: number = 1
): Promise<ActivitySkillRecord> {
  const payload = {
    skill_id: skillId,
    required_level: requiredLevel,
    weight: Math.max(0, Math.min(1, weight)),
  };

  const res = await fetch(`${BASE}/activities/${activityId}/skills`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await handle(res);
  return data;
}

export async function getActivitySkills(activityId: string): Promise<ActivitySkillRecord[]> {
  const res = await fetch(`${BASE}/activities/${activityId}/skills`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await handle(res);
  return Array.isArray(data) ? data : [];
}

export async function updateActivitySkill(
  activityId: string,
  skillId: string,
  patch: { required_level?: "LOW" | "MEDIUM" | "HIGH" | "EXPERT"; weight?: number }
): Promise<ActivitySkillRecord> {
  const res = await fetch(`${BASE}/activities/${activityId}/skills/${skillId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });

  const data = await handle(res);
  return data;
}

export async function removeSkillFromActivity(activityId: string, skillId: string): Promise<void> {
  const res = await fetch(`${BASE}/activities/${activityId}/skills/${skillId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  await handle(res);
}

// ==================== Available Skills ====================

export type Skill = {
  _id: string;
  name: string;
  category: "KNOWLEDGE" | "KNOW_HOW" | "SOFT";
  description?: string;
};

export async function listSkills(): Promise<Skill[]> {
  const res = await fetch(`${BASE}/skills`, {
    method: "GET",
    headers: authHeaders(),
  });

  const data = await handle(res);
  return Array.isArray(data) ? data : [];
}
