export class SequenceService {
  constructor(startMode, initialSequenceNo = 0) {
    this.startMode = startMode;
    // For START:Y, expected sequence number is always 1 initially
    if (this.startMode === 'START:Y') {
      this.currentSequenceNo = 0; // The next expected is 1
      this.expectedSequenceNo = 1;
    } else {
      // For START:N, expected is last + 1
      this.currentSequenceNo = initialSequenceNo;
      this.expectedSequenceNo = initialSequenceNo + 1;
    }

    // Track gap detection
    this.gapDetected = false;
    this.lastGapDetails = null;
  }

  setAcceptedSequenceNo(seqNo) {
    // This is called when Login Accepted provides the starting sequence
    if (this.startMode === 'START:N' && seqNo > 0) {
      this.expectedSequenceNo = seqNo;
      this.currentSequenceNo = seqNo - 1;
    }
  }

  processSequencedPacket(packetSequenceNo) {
    // If the server provides a sequence number (which it theoretically doesn't in SoupBinTCP Sequenced data,
    // but the local counter acts as the implied sequence).
    // The requirement states "assign sequenceNo locally".

    // Assign locally
    const assignedSeqNo = this.expectedSequenceNo;

    // Increment the local counters
    this.currentSequenceNo = assignedSeqNo;
    this.expectedSequenceNo = assignedSeqNo + 1;

    return assignedSeqNo;
  }

  handleExplicitSequence(explicitSeqNo) {
      // If we receive an explicit sequence number from another system or cache
      if (explicitSeqNo > this.expectedSequenceNo) {
          this.gapDetected = true;
          this.lastGapDetails = { expected: this.expectedSequenceNo, received: explicitSeqNo };
      } else if (explicitSeqNo < this.expectedSequenceNo) {
          // duplicate
          return false;
      }
      this.currentSequenceNo = explicitSeqNo;
      this.expectedSequenceNo = explicitSeqNo + 1;
      return true;
  }

  getLastSequenceNo() {
    return this.currentSequenceNo;
  }

  getNextExpectedSequenceNo() {
    return this.expectedSequenceNo;
  }

  reset(newSequenceNo = 1) {
    this.currentSequenceNo = newSequenceNo - 1;
    this.expectedSequenceNo = newSequenceNo;
    this.gapDetected = false;
  }
}
