import { GetRequest } from '@/utils/requests';
import {
  OrgRole,
  PermissionsApiResponse,
  RolePermissionList,
  RolesApiResponse,
  SystemPermission,
} from '@/types/roles-permissions';

/** Legacy API keys that may appear on roles vs canonical keys from GET /permissions */
const PERMISSION_KEY_VARIANTS: Record<string, string[]> = {
  can_create_channels: ['can_create_channels', 'can_create_channel'],
  can_create_channel: ['can_create_channels', 'can_create_channel'],
  can_comment_threads: ['can_comment_threads', 'can_comment_on_threads'],
  can_comment_on_threads: ['can_comment_threads', 'can_comment_on_threads'],
  can_remove_people: [
    'can_remove_people',
    'can_remove_people_from_organization',
  ],
  can_remove_people_from_organization: [
    'can_remove_people',
    'can_remove_people_from_organization',
  ],
  can_create_role: ['can_create_role', 'can_create_custom_role'],
  can_create_custom_role: ['can_create_role', 'can_create_custom_role'],
};

export const getPermissionKeyVariants = (permissionKey: string): string[] => {
  return PERMISSION_KEY_VARIANTS[permissionKey] ?? [permissionKey];
};

export const permissionListToArray = (
  permissionList?: RolePermissionList | null,
): string[] => {
  if (!permissionList) {
    return [];
  }
  return Object.entries(permissionList)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);
};

export const normalizePermissionsSource = (
  permissions: string[] | RolePermissionList | null | undefined,
): string[] => {
  if (!permissions) {
    return [];
  }
  if (Array.isArray(permissions)) {
    return permissions.filter(Boolean);
  }
  return permissionListToArray(permissions);
};

export const getEnabledPermissionsFromRole = (
  role?: OrgRole | null,
): string[] => {
  if (!role?.permissions?.permission_list) {
    return [];
  }
  return permissionListToArray(role.permissions.permission_list);
};

export const getUserPermissionKeys = (
  orgData:
    | {
        user_role?: {
          permissions?: string[] | RolePermissionList;
          permission_list?: RolePermissionList;
        };
      }
    | null
    | undefined,
): string[] => {
  const fromRole = normalizePermissionsSource(orgData?.user_role?.permissions);
  if (fromRole.length > 0) {
    return fromRole;
  }
  return normalizePermissionsSource(orgData?.user_role?.permission_list);
};

export const groupPermissionsByCategory = (
  permissions: SystemPermission[],
): Record<string, SystemPermission[]> => {
  return permissions.reduce<Record<string, SystemPermission[]>>(
    (acc, permission) => {
      const category = permission.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {},
  );
};

export const fetchSystemPermissions = async (): Promise<{
  permissions: SystemPermission[];
  error: string | null;
}> => {
  const { data, error } = await GetRequest<PermissionsApiResponse>(
    '/permissions',
  );
  if (error || !data?.data) {
    return {
      permissions: [],
      error: typeof error === 'string' ? error : 'Failed to load permissions',
    };
  }
  return { permissions: data.data, error: null };
};

export const fetchSystemRoles = async (): Promise<{
  roles: OrgRole[];
  error: string | null;
}> => {
  const { data, error } = await GetRequest<RolesApiResponse>('/roles');
  if (error || !data?.data) {
    return {
      roles: [],
      error: typeof error === 'string' ? error : 'Failed to load roles',
    };
  }
  return { roles: data.data, error: null };
};

export const fetchRolesAndPermissions = async () => {
  const [permissionsResult, rolesResult] = await Promise.all([
    fetchSystemPermissions(),
    fetchSystemRoles(),
  ]);

  return {
    permissions: permissionsResult.permissions,
    roles: rolesResult.roles,
    error: permissionsResult.error || rolesResult.error,
  };
};
