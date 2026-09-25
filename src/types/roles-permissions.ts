export type SystemPermission = {
  key: string;
  name: string;
  category: string;
  description: string;
};

export type RolePermissionList = Record<string, boolean>;

export type RolePermissions = {
  id: string;
  role_id: string;
  permission_list: RolePermissionList;
  is_default?: boolean;
};

export type OrgRole = {
  id: string;
  name: string;
  description: string;
  organisation_id: string | null;
  is_default: boolean;
  permissions?: RolePermissions | null;
};

export type PermissionsApiResponse = {
  status: string;
  status_code: number;
  message: string;
  data: SystemPermission[];
};

export type RolesApiResponse = {
  status: string;
  status_code: number;
  message: string;
  data: OrgRole[];
};
