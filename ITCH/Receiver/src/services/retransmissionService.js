export class RetransmissionService {
  constructor(messageStore) {
    this.messageStore = messageStore;
  }

  async processRequest(requestObj) {
    if (!requestObj.socketID) {
      throw new Error('socketID required');
    }

    const beginSeq = parseInt(requestObj.beginningSequence, 10);
    const endSeq = parseInt(requestObj.endingSequence, 10);

    if (isNaN(beginSeq) || beginSeq < 1) {
      throw new Error('beginningSequence must be >= 1');
    }
    if (isNaN(endSeq) || endSeq < beginSeq) {
      throw new Error('endingSequence must be >= beginningSequence');
    }

    // Optional: Max limit validation
    if (endSeq - beginSeq > 10000) {
      throw new Error('requested range exceeds maximum allowed (10000)');
    }

    if (!this.messageStore) {
        throw new Error('Message store not configured');
    }

    const messagesJsonStrs = await this.messageStore.getMessagesBySequenceRange(beginSeq, endSeq);
    const messages = messagesJsonStrs.map(str => JSON.parse(str));

    return {
      socketID: requestObj.socketID,
      beginningSequence: beginSeq,
      endingSequence: endSeq,
      count: messages.length,
      messages: messages
    };
  }
}
