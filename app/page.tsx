"use client";

import { useState } from "react";

import AuthForm from "@/components/AuthForm";
import TaskBoard from "@/components/TaskBoard";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <main>
      <h1>TaskFlow</h1>
      {token ? (
        <TaskBoard token={token} onLogout={() => setToken(null)} />
      ) : (
        <AuthForm onAuthed={setToken} />
      )}
    </main>
  );
}
