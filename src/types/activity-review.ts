export type ActivityReviewStatus =
  | "HR_DRAFT"
  | "SUBMITTED_TO_MANAGER"
  | "CHANGES_REQUESTED"
  | "RESUBMITTED_BY_HR"
  | "APPROVED_BY_MANAGER";

export type ActivityReviewRecord = {
  _id: string;
  activityId: string;
  hrSelectedEmployeeIds: string[];
  managerSelectedEmployeeIds?: string[];
  status: ActivityReviewStatus;
  hrNote?: string;
  managerNote?: string;
  revisionNumber?: number;
};
