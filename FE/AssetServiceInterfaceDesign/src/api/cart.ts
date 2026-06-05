import { apiRequest } from "./client";
import type { Cart, CartItem } from "./types/commerce";

export async function fetchCart(): Promise<Cart> {
  return apiRequest<Cart>("/cart");
}

export async function addCartItem(assetId: string, quantity = 1): Promise<CartItem> {
  return apiRequest<CartItem>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ assetId, quantity }),
  });
}

export async function updateCartItem(id: string, quantity: number): Promise<CartItem> {
  return apiRequest<CartItem>(`/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(id: string): Promise<void> {
  return apiRequest<void>(`/cart/items/${id}`, { method: "DELETE" });
}

export async function clearCart(): Promise<void> {
  return apiRequest<void>("/cart", { method: "DELETE" });
}
