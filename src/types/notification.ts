export type NotificationType =
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'SKILL_SUBMITTED'
  | 'SKILL_APPROVED'
  | 'SKILL_REJECTED'
  | 'ACTIVITY_ASSIGNED'
  | 'GENERAL';

export type NotificationChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type NotificationMetadata = {
  entityType?: 'USER_PROFILE' | 'USER_ROLE' | 'EMPLOYEE_PROFILE' | 'ACTIVITY_CREATED' | string;
  actorName?: string | null;
  actorRole?: string | null;
  updatedByRole?: string;
  updatedUserId?: string;
  employeeId?: string;
  userId?: string;
  role?: string;
  activityId?: string;
  departmentId?: string;
  departmentName?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: NotificationChange[];
  activitySnapshot?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  userId: string;
  link?: string;
  metadata?: NotificationMetadata;
}