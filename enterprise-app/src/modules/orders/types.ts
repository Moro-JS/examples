// Order Types - New Module Structure
export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  userId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderRequest {
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items?: OrderItem[];
}
