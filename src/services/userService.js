/**
 * User Service Helpers
 *
 * Shared helpers for user email validation and lookups
 */

import * as firestoreService from './firestoreService';
import { USER_ROLES } from '../config/constants';

export const normalizeEmail = (email = '') => email.trim().toLowerCase();

const buildRoleSet = (profile, hasHostCollectionRecord = false) => {
  const roles = new Set();
  if (!profile && !hasHostCollectionRecord) {
    return roles;
  }

  if (profile?.role) {
    roles.add(profile.role);
  }
  if (Array.isArray(profile?.roles)) {
    profile.roles.forEach((role) => roles.add(role));
  }
  if (hasHostCollectionRecord) {
    roles.add(USER_ROLES.HOST);
  }
  return roles;
};

/**
 * Get usage metadata for an email across roles
 * @param {string} email
 * @returns {Promise<{existingProfile: Object|null, hasGuest: boolean, hasHost: boolean, fullyUsed: boolean, hostRecord: Object|null}>}
 */
export const getEmailRoleUsage = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return {
      existingProfile: null,
      hostRecord: null,
      hasGuest: false,
      hasHost: false,
      fullyUsed: false
    };
  }

  const [existingUsers, existingHosts] = await Promise.all([
    firestoreService.getDocuments(
      'users',
      [{ field: 'emailLower', operator: '==', value: normalizedEmail }],
      null,
      'asc',
      1
    ),
    firestoreService.getDocuments(
      'hosts',
      [{ field: 'emailLower', operator: '==', value: normalizedEmail }],
      null,
      'asc',
      1
    )
  ]);

  const existingProfile = existingUsers[0] || null;
  const hostRecord = existingHosts[0] || null;
  const roleSet = buildRoleSet(existingProfile, !!hostRecord);
  const hasGuest = roleSet.has(USER_ROLES.GUEST);
  const hasHost = roleSet.has(USER_ROLES.HOST);

  return {
    existingProfile,
    hostRecord,
    hasGuest,
    hasHost,
    fullyUsed: hasGuest && hasHost
  };
};



