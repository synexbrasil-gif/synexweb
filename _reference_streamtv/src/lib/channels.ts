export type Channel = {
  id: string;
  name: string;
  category: string;
  logo: string;
  url: string;
  description?: string;
};

// Public test HLS streams
export const channels: Channel[] = [
  {
    id: "bigbuck",
    name: "Big Buck Bunny",
    category: "Filmes",
    logo: "🐰",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    description: "Animação clássica em loop",
  },
  {
    id: "sintel",
    name: "Sintel HD",
    category: "Filmes",
    logo: "🎬",
    url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    description: "Curta-metragem épico",
  },
  {
    id: "tears",
    name: "Tears of Steel",
    category: "Filmes",
    logo: "⚔️",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    description: "Sci-fi short film",
  },
  {
    id: "mux",
    name: "Mux Live Demo",
    category: "Ao Vivo",
    logo: "📡",
    url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
    description: "Stream de demonstração",
  },
  {
    id: "apple-bipbop",
    name: "Apple BipBop",
    category: "Ao Vivo",
    logo: "🍎",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    description: "Stream de referência Apple",
  },
  {
    id: "akamai",
    name: "Akamai HLS",
    category: "Ao Vivo",
    logo: "🌐",
    url: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
    description: "Stream demo Akamai",
  },
  {
    id: "sports",
    name: "Sports Channel",
    category: "Esportes",
    logo: "⚽",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    description: "Demo esportes 24h",
  },
  {
    id: "news",
    name: "News 24",
    category: "Notícias",
    logo: "📰",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    description: "Notícias ao vivo",
  },
  {
    id: "music",
    name: "Music HD",
    category: "Música",
    logo: "🎵",
    url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    description: "Hits 24 horas",
  },
];

export const categories = Array.from(new Set(channels.map((c) => c.category)));
