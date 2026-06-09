// Placeholder for V2026 Schemas
export const itchV2026Schemas = {
  'T': { name: 'Seconds Message', fields: [{ name: 'second', type: 'uint32' }] },
  'R': { name: 'Order Book Directory Message', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'symbol', type: 'alpha', length: 16 }] },
  'S': { name: 'System Event Message', fields: [{ name: 'eventCode', type: 'alpha', length: 1 }] },
  'O': { name: 'Order Book State Message', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'stateName', type: 'alpha', length: 20 }] },
  'A': { name: 'Add Anonymous Order', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'buySellIndicator', type: 'alpha', length: 1 }, { name: 'shares', type: 'uint32' }, { name: 'orderBookId', type: 'uint32' }, { name: 'price', type: 'int64' }] },
  'F': { name: 'Add Attributed Order', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'buySellIndicator', type: 'alpha', length: 1 }, { name: 'shares', type: 'uint32' }, { name: 'orderBookId', type: 'uint32' }, { name: 'price', type: 'int64' }, { name: 'attribution', type: 'alpha', length: 4 }] },
  'E': { name: 'Order Executed', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'executedShares', type: 'uint32' }, { name: 'matchNumber', type: 'uint64' }] },
  'C': { name: 'Order Executed with Price', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'executedShares', type: 'uint32' }, { name: 'matchNumber', type: 'uint64' }, { name: 'printable', type: 'alpha', length: 1 }, { name: 'executionPrice', type: 'int64' }] },
  'D': { name: 'Order Delete', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }] },
  'P': { name: 'Trade', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'tradeType', type: 'alpha', length: 1 }, { name: 'shares', type: 'uint32' }, { name: 'orderBookId', type: 'uint32' }, { name: 'matchNumber', type: 'uint64' }, { name: 'price', type: 'int64' }] },
  'Z': { name: 'Equilibrium Price', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'bestBidPrice', type: 'int64' }, { name: 'bestBidSize', type: 'uint32' }, { name: 'bestAskPrice', type: 'int64' }, { name: 'bestAskSize', type: 'uint32' }] }
};
