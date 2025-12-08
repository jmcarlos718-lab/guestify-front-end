/**
 * Message Model
 * 
 * Data model and validation for message documents
 */

/**
 * Create a new message document
 * @param {Object} messageData - Message data
 * @returns {Object} Message document
 */
export const createMessageDocument = (messageData) => {
  const {
    conversationId,
    senderId,
    receiverId,
    content,
    type = 'text', // text, image, file, system
    attachments = [],
    isRead = false,
    createdAt = new Date(),
    updatedAt = new Date()
  } = messageData;

  return {
    conversationId,
    senderId,
    receiverId,
    content,
    type,
    attachments,
    isRead,
    readAt: null,
    deletedBy: [], // Array of user IDs who deleted the message
    createdAt,
    updatedAt
  };
};

/**
 * Validate message data
 * @param {Object} messageData - Message data to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateMessage = (messageData) => {
  const errors = [];

  if (!messageData.senderId) {
    errors.push('Sender ID is required');
  }

  if (!messageData.receiverId) {
    errors.push('Receiver ID is required');
  }

  if (messageData.senderId === messageData.receiverId) {
    errors.push('Sender and receiver cannot be the same');
  }

  if (!messageData.content || messageData.content.trim().length === 0) {
    if (messageData.type === 'text' && (!messageData.attachments || messageData.attachments.length === 0)) {
      errors.push('Message content is required');
    }
  }

  const validTypes = ['text', 'image', 'file', 'system'];
  if (!validTypes.includes(messageData.type)) {
    errors.push('Invalid message type');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create or get conversation ID
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} Conversation ID
 */
export const getConversationId = (userId1, userId2) => {
  // Sort IDs to ensure consistent conversation ID
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};




























