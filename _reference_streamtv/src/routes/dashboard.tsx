import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/iptv/Sidebar";
import { Player } from "@/components/iptv/Player";
import { channels } from "@/lib/channels";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "StreamTV — Player IPTV Premium" },
      {
        name: "description",
        content: "Player IPTV moderno e profissional com suporte HLS, busca e troca dinâmica de canais.",
      },
    ],
  }),
});

function DashboardPage() {
  const [current, setCurrent] = useState(channels[0]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar current={current} onSelect={setCurrent} />
      <Player channel={current} />
    </div>
  );
}
