"use client";

import { ReactFlowProvider } from "reactflow";
import { Canvas } from "@/components/Canvas";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <ReactFlowProvider>
        <Sidebar />
        <Canvas />
      </ReactFlowProvider>
    </main>
  );
}
