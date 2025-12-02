"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface BannerContextType {
  isBannerVisible: boolean;
  setIsBannerVisible: (visible: boolean) => void;
  bannerHeight: number;
}

const BannerContext = createContext<BannerContextType>({
  isBannerVisible: false,
  setIsBannerVisible: () => {},
  bannerHeight: 50,
});

export function useBanner() {
  return useContext(BannerContext);
}

export function BannerProvider({ children }: { children: ReactNode }) {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const bannerHeight = 50;

  return (
    <BannerContext.Provider
      value={{ isBannerVisible, setIsBannerVisible, bannerHeight }}
    >
      {children}
    </BannerContext.Provider>
  );
}
