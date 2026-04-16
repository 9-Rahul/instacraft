"use client";

import { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "@/lib/firebase";

const WishlistContext = createContext(null);

function wishlistReducer(state, action) {
  switch (action.type) {
    case "ADD":
      if (state.items.find((i) => i.id === action.item.id)) return state;
      return { items: [...state.items, action.item] };
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "TOGGLE": {
      const exists = state.items.find((i) => i.id === action.item.id);
      if (exists)
        return { items: state.items.filter((i) => i.id !== action.item.id) };
      return { items: [...state.items, action.item] };
    }
    case "HYDRATE":
      return { items: action.items };
    default:
      return state;
  }
}

export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] });
  const { user } = useAuth();
  const dbHydrated = useRef(false);

  // 1. Initially load from Local Storage (Fastest)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ishta_wishlist");
      if (saved) dispatch({ type: "HYDRATE", items: JSON.parse(saved) });
    } catch {}
  }, []);

  // 2. Fetch from DB if user authenticates
  useEffect(() => {
    if (!user) {
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
        
        // Ensure response is OK and is JSON before parsing
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Received non-JSON response from server");
        }

        const data = await res.json();
        
        if (data.success && Array.isArray(data.wishlist) && isMounted) {
          const dbWishlist = data.wishlist;
          let mergedWishlist = [...dbWishlist];
          
          try {
            const localSaved = JSON.parse(localStorage.getItem("ishta_wishlist")) || [];
            
            // For wishlist, we just add distinct items.
            localSaved.forEach(localItem => {
              const existingIdx = mergedWishlist.findIndex(dbItem => dbItem.id === localItem.id);
              if (existingIdx === -1) {
                mergedWishlist.push(localItem);
              }
            });
          } catch(e) {}

          dispatch({ type: "HYDRATE", items: mergedWishlist });
          dbHydrated.current = true;
        }
      } catch (err) {
        console.error("Failed to sync wishlist from DB");
      }
    };

    fetchDBState();
    return () => { isMounted = false; };
  }, [user]);

  // 3. Persist to localStorage ALWAYS, and push to DB if authenticated
  useEffect(() => {
    localStorage.setItem("ishta_wishlist", JSON.stringify(state.items));
    
    if (user && dbHydrated.current) {
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
            body: JSON.stringify({ wishlist: state.items })
          });
        } catch(e) {}
      };
      
      const timeoutId = setTimeout(() => pushToDB(), 1000); // 1s Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [state.items, user]);

  const addItem = (item) => dispatch({ type: "ADD", item });
  const removeItem = (id) => dispatch({ type: "REMOVE", id });
  const toggleItem = (item) => dispatch({ type: "TOGGLE", item });
  const isInWishlist = (id) => state.items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        count: state.items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
