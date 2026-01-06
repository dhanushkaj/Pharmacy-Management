// Utility to fetch last selling price for a product
import { api } from './api';

export async function getLastSellingPrice(productId, token) {
  // Calls backend /api/products/{id} which returns lastPrice
  const product = await api(`/api/products/${productId}`, { token });
  return product.lastPrice;
}
