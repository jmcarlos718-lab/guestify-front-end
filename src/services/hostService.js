/**
 * Host Service
 *
 * Helper functions for managing host profiles
 */

import * as firestoreService from './firestoreService';
import { createHostDocument, normalizeHostEmail } from '../models/hostModel';
import { USER_ROLES } from '../config/constants';

const COLLECTION_NAME = 'hosts';

export const getHostByEmail = async (email) => {
  const normalizedEmail = normalizeHostEmail(email);
  if (!normalizedEmail) return null;

  const results = await firestoreService.getDocuments(
    COLLECTION_NAME,
    [{ field: 'emailLower', operator: '==', value: normalizedEmail }],
    null,
    'asc',
    1
  );

  return results.length > 0 ? results[0] : null;
};

export const getHostByUid = async (uid) => {
  if (!uid) return null;
  return await firestoreService.getDocument(COLLECTION_NAME, uid);
};

export const createHostProfile = async (hostData) => {
  const hostDocument = createHostDocument({
    ...hostData,
    role: USER_ROLES.HOST
  });

  await firestoreService.createDocument(
    COLLECTION_NAME,
    hostDocument,
    hostData.uid || undefined
  );

  return hostDocument;
};

export const ensureHostProfile = async (hostData) => {
  const existing = await getHostByUid(hostData.uid);
  if (existing) {
    return existing;
  }
  return await createHostProfile(hostData);
};



