"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef
} from "react";
import { useAuth } from "./AuthContext";
import { auth } from "@/lib/firebase";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id
              ? { ...i, qty: i.qty + (action.qty || 1) }
              : i,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, qty: action.qty || 1 }],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "REMOVE_BY_SLUG":
      return { ...state, items: state.items.filter((i) => i.slug !== action.slug) };
    case "UPDATE_QTY":
      if (action.qty <= 0)
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.id),
        };
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: action.qty } : i,
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "HYDRATE":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const dbHydrated = useRef(false);

  // When user logs in → fetch cart from DB
  // When user logs out → clear cart from memory
  useEffect(() => {
    if (!user) {
      dispatch({ type: "CLEAR_CART" });
      dbHydrated.current = false;
      return;
    }

    let isMounted = true;
    const fetchDBState = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/profile/state", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server");
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.cart) && isMounted) {
          dispatch({ type: "HYDRATE", items: data.cart });
          dbHydrated.current = true;
        }
      } catch (err) {
        console.error("Failed to sync cart from DB:", err);
      }
    };

    fetchDBState();
    return () => { isMounted = false; };
  }, [user]);

  // Sync cart changes to DB only (no localStorage)
  useEffect(() => {
    if (!user || !dbHydrated.current) return;

    const pushToDB = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        await fetch("/api/profile/state", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ cart: state.items })
        });
      } catch (e) {
        console.error("Failed to persist cart to DB:", e);
      }
    };

    const timeoutId = setTimeout(() => pushToDB(), 1000); // 1s debounce
    return () => clearTimeout(timeoutId);
  }, [state.items, user]);

  const addItem = (item, qty = 1) => dispatch({ type: "ADD_ITEM", item, qty });
  const removeItem = (id) => dispatch({ type: "REMOVE_ITEM", id });
  const removeItemBySlug = (slug) => dispatch({ type: "REMOVE_BY_SLUG", slug });
  const updateQty = (id, qty) => dispatch({ type: "UPDATE_QTY", id, qty });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = state.items.reduce(
    (sum, i) => sum + (i.salePrice || i.price) * i.qty,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        removeItemBySlug,
        updateQty,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
