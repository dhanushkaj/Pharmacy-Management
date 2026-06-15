// Utility to fetch last selling price and last cost price for a product
import { api } from './api';

export async function getLastSellingPrice(productId, token) {
  // Calls backend /api/products/{id} which returns lastPrice
  const product = await api(`/api/products/${productId}`, { token });
  return product.lastPrice;
}

export async function getLastCostPrice(productId, token) {
  // Calls backend /api/products/{id} which returns lastCostPrice
  const product = await api(`/api/products/${productId}`, { token });
  return product.lastCostPrice;
}

export async function getLastPrices(productId, token) {
  // Fetch both lastPrice and lastCostPrice in a single API call
  const product = await api(`/api/products/${productId}`, { token });
  return { lastPrice: product.lastPrice, lastCostPrice: product.lastCostPrice };
}
