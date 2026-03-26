export type PrivateLayoutContext = {
  canManage: boolean;
  canManageUsers: boolean;
  canEditUsers: boolean;
  canManageChildren: boolean;
  canManageActivities: boolean;
  canPublishPosts: boolean;
  canCreateAdmin: boolean;
  canManageLessons: boolean;
  canManageCommunities: boolean;
  canCreateCommunities: boolean;
  canAssignCommunityAdmins: boolean;
  /** Detail routes (e.g. child name) override the raw id chip in the breadcrumb when set. */
  setBreadcrumbDetailLabel: (label: string | null) => void;
};
