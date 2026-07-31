// List NVIDIA catalog models matching our candidate names
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
  headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
});
console.log("HTTP", res.status);
const data = await res.json();
const wanted = [
  "minimaxai/minimax-m3",
  "nemotron-3-ultra",
  "kimi-k2.6",
  "deepseek-v4",
  "gemma-4-31b",
  "nemotron-3-nano",
  "nemotron-nano-12b",
  "nemotron-nano-9b",
  "gpt-oss",
  "llama-3.3-nemotron-super",
  "mistral-nemotron",
  "llama-3.1-nemotron-nano",
  "kimi",
  "minimax",
];
const all = data?.data ?? [];
console.log("TOTAL MODELS:", all.length);
const ids = all.map((m) => m.id);
for (const w of wanted) {
  const matches = ids.filter((id) => id.toLowerCase().includes(w.toLowerCase()));
  console.log(`\n=== ${w} ===`);
  matches.forEach((m) => console.log("  ", m));
}
