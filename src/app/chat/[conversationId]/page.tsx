"use client";

import ChatInterface from "@/components/ChatInterface";
import { useParams } from "next/navigation";

function App() {
  const params = useParams();
  return <ChatInterface conversationId={params.conversationId as string} />;
}

export default App;
