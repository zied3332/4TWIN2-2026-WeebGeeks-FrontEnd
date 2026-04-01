export type NotificationType =
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'SKILL_SUBMITTED'
  | 'SKILL_APPROVED'
  | 'SKILL_REJECTED'
  | 'ACTIVITY_ASSIGNED'
  | 'GENERAL';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  userId: string;
  link?: string;
  metadata?: Record<string, any>;
}