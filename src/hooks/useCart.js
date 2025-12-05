import { useState, useEffect } from "react";

export const useCart = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) || [];
        // Ensure older items get a cartId (id::size)
        const normalized = parsed.map((i) => ({
          ...i,
          cartId: i.cartId ?? `${i.id}::${i.size ?? ""}`,
        }));
        setItems(normalized);
      } catch (e) {
        setItems([]);
      }
    }
  }, []);

  const saveCart = (cartItems) => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    setItems(cartItems);
  };

  const getCartKey = (item) => `${item.id}::${item.size ?? ""}`;

  const addItem = (item) => {
    const key = getCartKey(item);
    const existingItem = items.find((i) => i.cartId === key);

    if (existingItem) {
      const updatedItems = items.map((i) =>
        i.cartId === key ? { ...i, quantity: (i.quantity || 0) + 1 } : i
      );
      saveCart(updatedItems);
    } else {
      const cartEntry = {
        ...item,
        quantity: 1,
        cartId: key,
      };
      saveCart([...items, cartEntry]);
    }
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }

    const updatedItems = items.map((item) =>
      item.cartId === cartId ? { ...item, quantity } : item
    );
    saveCart(updatedItems);
  };

  const removeItem = (cartId) => {
    const updatedItems = items.filter((item) => item.cartId !== cartId);
    saveCart(updatedItems);
  };

  const clearCart = () => {
    localStorage.removeItem("cart");
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    total,
  };
};
