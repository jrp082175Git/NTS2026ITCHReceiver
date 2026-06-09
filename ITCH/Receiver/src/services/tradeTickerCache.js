export class TradeTickerCache {
  constructor(maxTrades = 1000) {
    this.trades = [];
    this.maxTrades = maxTrades;
  }

  addTrade(tradeData) {
    this.trades.push(tradeData);
    if (this.trades.length > this.maxTrades) {
      this.trades.shift();
    }
  }

  getTrades() {
    return this.trades;
  }

  clear() {
    this.trades = [];
  }
}
