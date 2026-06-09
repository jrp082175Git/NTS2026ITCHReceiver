export class OrderBookCache {
  constructor() {
    this.orders = new Map();
  }

  addOrder(orderRefNum, orderData) {
    this.orders.set(orderRefNum, orderData);
  }

  executeOrder(orderRefNum, executedShares) {
    const order = this.orders.get(orderRefNum);
    if (order) {
      order.shares -= executedShares;
      if (order.shares <= 0) {
        this.orders.delete(orderRefNum);
      } else {
        this.orders.set(orderRefNum, order);
      }
    }
  }

  deleteOrder(orderRefNum) {
    this.orders.delete(orderRefNum);
  }

  clear() {
    this.orders.clear();
  }
}
