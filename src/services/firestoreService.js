/**
 * Firestore Service
 * 
 * Handles all Firestore database operations
 * Provides CRUD operations for collections
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get a single document by ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Array of filter objects [{field, operator, value}]
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} limitCount - Maximum number of documents
 * @returns {Promise<Array>} Array of documents
 */
export const getDocuments = async (
  collectionName,
  filters = [],
  orderByField = null,
  orderDirection = 'asc',
  limitCount = null
) => {
  try {
    let q = collection(db, collectionName);

    // Apply filters
    if (filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return documents;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

/**
 * Create a new document
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @param {string} docId - Optional document ID (if not provided, auto-generated)
 * @returns {Promise<string>} Document ID
 */
export const createDocument = async (collectionName, data, docId = null) => {
  try {
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, dataWithTimestamp);
      return docId;
    } else {
      const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update an existing document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, dataWithTimestamp);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Batch write operations
 * @param {Array} operations - Array of operation objects {type, collection, docId, data}
 * @returns {Promise<void>}
 */
export const batchWrite = async (operations) => {
  try {
    const batch = writeBatch(db);

    operations.forEach(op => {
      const docRef = doc(db, op.collection, op.docId);

      switch (op.type) {
        case 'create':
        case 'set':
          batch.set(docRef, {
            ...op.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            updatedAt: serverTimestamp()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
};

/**
 * Run a transaction
 * @param {Function} transactionFunction - Function that performs transaction operations
 * @returns {Promise<any>} Transaction result
 */
export const runTransactionOperation = async (transactionFunction) => {
  try {
    return await runTransaction(db, transactionFunction);
  } catch (error) {
    console.error('Error in transaction:', error);
    throw error;
  }
};

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {Date} JavaScript Date object
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 * @param {Date} date - JavaScript Date
 * @returns {Timestamp} Firestore Timestamp
 */
export const dateToTimestamp = (date) => {
  if (!date) return null;
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
};

/**
 * Subscribe to documents with real-time updates
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Array of filter objects [{field, operator, value}]
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} limitCount - Maximum number of documents
 * @param {Function} callback - Callback function that receives (documents, error)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDocuments = (
  collectionName,
  filters = [],
  orderByField = null,
  orderDirection = 'asc',
  limitCount = null,
  callback
) => {
  try {
    let q = collection(db, collectionName);

    // Apply filters
    if (filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(documents, null);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        callback([], error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
    callback([], error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};



















