// Placeholder for V2015 Schemas
export const itchV2015Schemas = {
  'T': { name: 'Time Stamp Seconds', fields: [{ name: 'second', type: 'uint32' }] },
  'S': { name: 'System Event', fields: [{ name: 'eventCode', type: 'alpha', length: 1 }] },
  'R': { name: 'Orderbook Directory', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'symbol', type: 'alpha', length: 16 }] },
  'L': { name: 'Price Tick Size', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'tickSizeId', type: 'uint32' }] },
  'M': { name: 'Quantity Tick Size', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'tickSizeId', type: 'uint32' }] },
  'A': { name: 'Add Order', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'buySellIndicator', type: 'alpha', length: 1 }, { name: 'shares', type: 'uint32' }, { name: 'orderBookId', type: 'uint32' }, { name: 'price', type: 'uint32_price' }] },
  'E': { name: 'Order Executed', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'executedShares', type: 'uint32' }, { name: 'matchNumber', type: 'uint64' }] },
  'C': { name: 'Order Executed With Price', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'executedShares', type: 'uint32' }, { name: 'matchNumber', type: 'uint64' }, { name: 'printable', type: 'alpha', length: 1 }, { name: 'executionPrice', type: 'uint32_price' }] },
  'B': { name: 'Broken Trade', fields: [{ name: 'matchNumber', type: 'uint64' }] },
  'D': { name: 'Order Delete', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }] },
  'U': { name: 'Order Replace', fields: [{ name: 'originalOrderReferenceNumber', type: 'uint64' }, { name: 'newOrderReferenceNumber', type: 'uint64' }, { name: 'shares', type: 'uint32' }, { name: 'price', type: 'uint32_price' }] },
  'P': { name: 'Trade', fields: [{ name: 'orderReferenceNumber', type: 'uint64' }, { name: 'buySellIndicator', type: 'alpha', length: 1 }, { name: 'shares', type: 'uint32' }, { name: 'orderBookId', type: 'uint32' }, { name: 'price', type: 'uint32_price' }, { name: 'matchNumber', type: 'uint64' }] },
  'O': { name: 'BBO Quotation', fields: [{ name: 'orderBookId', type: 'uint32' }, { name: 'bestBidPrice', type: 'uint32_price' }, { name: 'bestBidSize', type: 'uint32' }, { name: 'bestAskPrice', type: 'uint32_price' }, { name: 'bestAskSize', type: 'uint32' }] },
  'N': { name: 'News Item', fields: [{ name: 'newsId', type: 'uint32' }, { name: 'headline', type: 'alpha', length: 100 }] }
};
