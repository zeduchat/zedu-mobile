import {
  fetchRolesAndPermissions,
  getPermissionKeyVariants,
  permissionListToArray,
} from '@/services/roles/roles-permissions.service';
import { OrgRole, SystemPermission } from '@/types/roles-permissions';

// Populated from GET /roles
export let DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {};
export let SYSTEM_ROLES: OrgRole[] = [];

// Populated from GET /permissions
export let SYSTEM_PERMISSIONS: SystemPermission[] = [];

let syncPromise: Promise<void> | null = null;

const normalizeRoleKey = (roleName: string): string => {
  return roleName.trim().toLowerCase().replace(/\s+/g, '_');
};

export const syncRolesAndPermissionsFromApi = async (): Promise<void> => {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const { permissions, roles } = await fetchRolesAndPermissions();

    SYSTEM_PERMISSIONS = permissions;
    SYSTEM_ROLES = roles;

    const nextRolePermissions: Record<string, string[]> = {};
    roles.forEach(role => {
      const roleKey = normalizeRoleKey(role.name);
      nextRolePermissions[roleKey] = permissionListToArray(
        role.permissions?.permission_list,
      );
    });

    DEFAULT_ROLE_PERMISSIONS = nextRolePermissions;
  })();

  return syncPromise;
};

const permissionKeyMatches = (
  grantedKey: string,
  requestedKey: string,
): boolean => {
  const grantedVariants = new Set([
    grantedKey,
    ...getPermissionKeyVariants(grantedKey),
  ]);
  return getPermissionKeyVariants(requestedKey).some(variant =>
    grantedVariants.has(variant),
  );
};

/** Logged-in user's role from organisation payload (set on sign-in / switch org / profile refresh). */
export type OrgUserRole = {
  role_id?: string;
  role_name?: string;
  name?: string;
  role?: string;
  permissions?: string[] | Record<string, boolean>;
  permission_list?: Record<string, boolean>;
};

export const getOrgUserRole = (
  orgData: { user_role?: OrgUserRole } | null | undefined,
): OrgUserRole | null => {
  return orgData?.user_role ?? null;
};

/** Match the user's assigned role to a role from GET /roles. */
export const findUserOrgRole = (
  orgData: { user_role?: OrgUserRole } | null | undefined,
): OrgRole | undefined => {
  const userRole = getOrgUserRole(orgData);
  if (!userRole || SYSTEM_ROLES.length === 0) {
    return undefined;
  }

  const roleId = userRole.role_id;
  if (roleId) {
    const byId = SYSTEM_ROLES.find(role => String(role.id) === String(roleId));
    if (byId) {
      return byId;
    }
  }

  const roleName = userRole.role_name || userRole.name || userRole.role;
  if (roleName) {
    const normalized = normalizeRoleKey(roleName);
    return SYSTEM_ROLES.find(
      role => normalizeRoleKey(role.name) === normalized,
    );
  }

  return undefined;
};

const getRoleTemplatePermissions = (roleName?: string | null): string[] => {
  if (!roleName) {
    return [];
  }
  const roleKey = normalizeRoleKey(roleName);
  return DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [];
};

const intersectWithRoleTemplate = (
  permissionKeys: string[],
  roleName?: string | null,
): string[] => {
  const template = getRoleTemplatePermissions(roleName);
  if (template.length === 0) {
    return permissionKeys;
  }
  const allowed = new Set(template);
  return permissionKeys.filter(key =>
    Array.from(allowed).some(allowedKey =>
      permissionKeyMatches(key, allowedKey),
    ),
  );
};

/**
 * Effective permissions for the logged-in user — from GET /roles for their assigned role,
 * with the same role-template filtering the app used before API-driven role catalogs.
 */
export const getEffectiveUserPermissions = (
  orgData: { user_role?: OrgUserRole } | null | undefined,
): string[] => {
  const userRole = getOrgUserRole(orgData);
  const roleName = userRole?.role_name || userRole?.name || userRole?.role;

  const matchedRole = findUserOrgRole(orgData);
  if (matchedRole) {
    return permissionListToArray(matchedRole.permissions?.permission_list);
  }

  if (roleName) {
    const fromTemplate = getRoleTemplatePermissions(roleName);
    if (fromTemplate.length > 0) {
      return fromTemplate;
    }
  }

  if (!userRole) {
    return [];
  }

  if (
    userRole.permission_list &&
    typeof userRole.permission_list === 'object'
  ) {
    const fromList = permissionListToArray(userRole.permission_list);
    return intersectWithRoleTemplate(fromList, roleName);
  }

  if (Array.isArray(userRole.permissions)) {
    return intersectWithRoleTemplate(
      userRole.permissions.filter(Boolean),
      roleName,
    );
  }

  if (userRole.permissions && typeof userRole.permissions === 'object') {
    const fromObject = permissionListToArray(userRole.permissions);
    return intersectWithRoleTemplate(fromObject, roleName);
  }

  return [];
};

export const userCan = (
  orgData: { user_role?: OrgUserRole } | null | undefined,
  permissionKey: string,
): boolean => {
  const enabled = getEffectiveUserPermissions(orgData);
  return enabled.some(key => permissionKeyMatches(key, permissionKey));
};

export function hasPermission(
  permissionsArr: string[] | undefined | null,
  permissionKey: string,
  role?: string,
  orgData?: { user_role?: OrgUserRole } | null,
): boolean {
  if (orgData) {
    return userCan(orgData, permissionKey);
  }

  if (Array.isArray(permissionsArr)) {
    const normalizedRole = role ? normalizeRoleKey(role) : undefined;
    if (normalizedRole && DEFAULT_ROLE_PERMISSIONS[normalizedRole]) {
      const allowed = new Set(DEFAULT_ROLE_PERMISSIONS[normalizedRole]);
      const validated = permissionsArr.filter(p => {
        return Array.from(allowed).some(allowedKey =>
          permissionKeyMatches(p, allowedKey),
        );
      });
      return validated.some(p => permissionKeyMatches(p, permissionKey));
    }
    return permissionsArr.some(p => permissionKeyMatches(p, permissionKey));
  }

  if (permissionsArr == null && role) {
    const normalizedRole = normalizeRoleKey(role);
    const perms = DEFAULT_ROLE_PERMISSIONS[normalizedRole];
    return perms
      ? perms.some(p => permissionKeyMatches(p, permissionKey))
      : false;
  }

  return false;
}
