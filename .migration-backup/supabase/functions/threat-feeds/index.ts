import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NormalizedThreat {
  id: string;
  title: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: string;
  confidence: number;
  source: string;
  ioc_type: string;
  ioc_value: string;
  first_seen: string;
  last_seen: string;
  tags: string[];
  malware_family?: string;
  reporter?: string;
}

// Severity by threat type
function threatSeverity(type: string, tags: string[]): "Critical" | "High" | "Medium" | "Low" {
  const t = type.toLowerCase();
  const allTags = tags.join(" ").toLowerCase();
  if (t.includes("ransomware") || t.includes("botnet") || allTags.includes("ransomware")) return "Critical";
  if (t.includes("rat") || t.includes("stealer") || t.includes("banker") || allTags.includes("apt")) return "High";
  if (t.includes("loader") || t.includes("dropper")) return "Medium";
  return "Medium";
}

// Map ThreatFox IOC type to readable label
function mapIOCType(type: string): string {
  const m: Record<string, string> = {
    "ip:port": "IP",
    "domain": "Domain",
    "url": "URL",
    "md5_hash": "Hash",
    "sha256_hash": "Hash",
    "sha1_hash": "Hash",
  };
  return m[type.toLowerCase()] ?? "IOC";
}

async function fetchThreatFox(): Promise<NormalizedThreat[]> {
  const body = JSON.stringify({ query: "get_iocs", days: 3 });
  const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`ThreatFox HTTP ${res.status}`);
  const json = await res.json();
  if (json.query_status !== "ok" || !Array.isArray(json.data)) return [];

  return (json.data as Record<string, unknown>[]).slice(0, 30).map((ioc, i) => {
    const tags: string[] = Array.isArray(ioc.tags) ? (ioc.tags as string[]) : [];
    const malwareFamily = (ioc.malware_printable as string | undefined) ?? (ioc.malware as string | undefined) ?? "Unknown";
    const iocType = mapIOCType(String(ioc.ioc_type ?? ""));
    const iocValue = String(ioc.ioc ?? "");
    const firstSeen = String(ioc.first_seen ?? new Date().toISOString());
    const lastSeen = String(ioc.last_seen ?? ioc.first_seen ?? new Date().toISOString());

    return {
      id: `tf-${String(ioc.id ?? i)}`,
      title: `${malwareFamily} — ${iocType} IOC`,
      category: (() => {
        const mf = malwareFamily.toLowerCase();
        if (mf.includes("ransomware")) return "Ransomware";
        if (mf.includes("rat") || mf.includes("remote")) return "RAT";
        if (mf.includes("banker") || mf.includes("stealer")) return "Malware";
        if (mf.includes("botnet") || mf.includes("mirai")) return "Botnet";
        if (mf.includes("loader") || mf.includes("dropper")) return "Loader";
        return "Malware";
      })(),
      severity: threatSeverity(malwareFamily, tags),
      status: "Active",
      confidence: Math.min(100, 70 + (tags.length * 5)),
      source: "ThreatFox (abuse.ch)",
      ioc_type: iocType,
      ioc_value: iocValue.length > 60 ? iocValue.slice(0, 57) + "..." : iocValue,
      first_seen: firstSeen,
      last_seen: lastSeen,
      tags: [...tags.slice(0, 4), malwareFamily].filter(Boolean),
      malware_family: malwareFamily,
      reporter: String(ioc.reporter ?? "community"),
    } as NormalizedThreat;
  });
}

async function fetchURLhaus(): Promise<NormalizedThreat[]> {
  const res = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/limit/20/", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`URLhaus HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.urls)) return [];

  return (json.urls as Record<string, unknown>[]).map((entry, i) => {
    const tags: string[] = Array.isArray(entry.tags) ? (entry.tags as string[]) : [];
    const url = String(entry.url ?? "");
    const host = String(entry.host ?? "");
    const threat = String(entry.threat ?? "malware_download");
    const urlid = String(entry.id ?? i);

    return {
      id: `uh-${urlid}`,
      title: `Malware Delivery URL — ${host || "unknown host"}`,
      category: threat.includes("phishing") ? "Phishing" : "Malware",
      severity: tags.some((t) => t.toLowerCase().includes("ransomware")) ? "Critical" : "High",
      status: String(entry.url_status ?? "online") === "online" ? "Active" : "Mitigated",
      confidence: 85,
      source: "URLhaus (abuse.ch)",
      ioc_type: "URL",
      ioc_value: url.length > 60 ? url.slice(0, 57) + "..." : url,
      first_seen: String(entry.date_added ?? new Date().toISOString()),
      last_seen: String(entry.date_added ?? new Date().toISOString()),
      tags: [...tags.slice(0, 3), "urlhaus"].filter(Boolean),
      reporter: String(entry.reporter ?? "community"),
    } as NormalizedThreat;
  });
}

// Cache in memory for current instance lifetime (~5 min edge function warmup)
let cache: { data: NormalizedThreat[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get("source") ?? "all"; // "all" | "threatfox" | "urlhaus"

    // Return cache if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      const filtered = source === "all"
        ? cache.data
        : cache.data.filter((t) => (source === "threatfox" ? t.source.includes("ThreatFox") : t.source.includes("URLhaus")));
      return new Response(JSON.stringify({ success: true, data: filtered, cached: true, count: filtered.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch both feeds concurrently with timeouts
    const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

    const [tfResults, uhResults] = await Promise.allSettled([
      Promise.race([fetchThreatFox(), timeout(8000)]),
      Promise.race([fetchURLhaus(), timeout(8000)]),
    ]);

    const threats: NormalizedThreat[] = [];
    const errors: string[] = [];

    if (tfResults.status === "fulfilled") {
      threats.push(...(tfResults.value as NormalizedThreat[]));
    } else {
      errors.push(`ThreatFox: ${(tfResults.reason as Error).message}`);
    }

    if (uhResults.status === "fulfilled") {
      threats.push(...(uhResults.value as NormalizedThreat[]));
    } else {
      errors.push(`URLhaus: ${(uhResults.reason as Error).message}`);
    }

    // Sort: active first, then by severity
    const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    threats.sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (b.status === "Active" && a.status !== "Active") return 1;
      return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
    });

    cache = { data: threats, ts: Date.now() };

    const filtered = source === "all"
      ? threats
      : threats.filter((t) => (source === "threatfox" ? t.source.includes("ThreatFox") : t.source.includes("URLhaus")));

    return new Response(
      JSON.stringify({ success: true, data: filtered, cached: false, count: filtered.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message, data: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
