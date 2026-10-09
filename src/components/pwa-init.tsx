"use client";

import { useEffect } from "react";
import { initPwa } from "@/lib/pwa";

/** Registers the service worker and starts listening for Chrome's install prompt. */
export function PwaInit() {
  useEffect(() => initPwa(), []);
  return null;
}
