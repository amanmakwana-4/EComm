import { useState, useEffect, useCallback, useMemo } from "react";

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

  const saveCart = useCallback((cartItems) => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    setItems(cartItems);
  }, []);

  const getCartKey = useCallback((item) => `${item.id}::${item.size ?? ""}`, []);

  const addItem = useCallback((item) => {
    setItems((prevItems) => {
      const key = `${item.id}::${item.size ?? ""}`;
      const existingItem = prevItems.find((i) => i.cartId === key);

      let updatedItems;
      if (existingItem) {
        updatedItems = prevItems.map((i) =>
          i.cartId === key ? { ...i, quantity: (i.quantity || 0) + 1 } : i
        );
      } else {
        const cartEntry = {
          ...item,
          quantity: 1,
          cartId: key,
        };
        updatedItems = [...prevItems, cartEntry];
      }
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  }, []);

  const updateQuantity = useCallback((cartId, quantity) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        const updatedItems = prevItems.filter((item) => item.cartId !== cartId);
        localStorage.setItem("cart", JSON.stringify(updatedItems));
        return updatedItems;
      }

      const updatedItems = prevItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      );
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  }, []);

  const removeItem = useCallback((cartId) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.cartId !== cartId);
      localStorage.setItem("cart", JSON.stringify(updatedItems));
      return updatedItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem("cart");
    setItems([]);
  }, []);

  // Memoize total calculation
  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0),
    [items]
  );

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    total,
  };
};
