import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: number;
  modelCode: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, size?: string, color?: string) => void;
  updateQuantity: (productId: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  isInCart: (productId: number, size?: string, color?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "haderos_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on init
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.color === item.color
      );

      if (existingIndex >= 0) {
        // Update quantity if item already exists
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity ?? 1),
        };
        return updated;
      }

      // Add new item
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const removeItem = (productId: number, size?: string, color?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.size === size &&
            item.color === color
          )
      )
    );
  };

  const updateQuantity = (
    productId: number,
    quantity: number,
    size?: string,
    color?: string
  ) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: number, size?: string, color?: string) => {
    return items.some(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
