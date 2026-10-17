"use client";

import React from "react";
import { JamSyncProvider } from "@/context/JamSyncContext";
import { JamSyncApp } from "@/components/jamsync/JamSyncApp";

export default function JamPage() {
  return (
    <JamSyncProvider>
      <JamSyncApp />
    </JamSyncProvider>
  );
}
