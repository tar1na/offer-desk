// Creates fictional [Sample] demo leads with contacts and meeting notes in Pipedrive.
// Run: node --env-file=.env scripts/seed-pipedrive.mjs   (skips leads that already exist)
const TOKEN = process.env.PIPEDRIVE_API_KEY;
if (!TOKEN) throw new Error("PIPEDRIVE_API_KEY missing");
const BASE = "https://api.pipedrive.com";

async function pd(path, method = "GET", data) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "x-api-token": TOKEN, "content-type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json();
  if (!res.ok || body.success === false) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body.data;
}

const daysAgo = (n, hour = 10) => {
  const d = new Date(Date.now() - n * 86400000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

const SAMPLES = [
  {
    title: "[Sample] IT support for three depots",
    org: "Halden Freight AB",
    person: { name: "Maria Lind", email: "maria.lind@example.com" },
    value: 46000,
    notes: [
      [9, "Intro call with Maria Lind (Operations Manager).\n\nFamily-owned freight company, 140 staff across three depots: Gothenburg, Borås and Trollhättan. Current IT provider contract ends in March and they are not renewing: slow response, nobody comes on site.\n\nWants one partner for help desk + on-site. Borås depot first, that's where Maria's team sits."],
      [2, "Depot walkthrough in Borås.\n\nWarehouse handheld scanners went down twice in September, each time about half a day of lost picking. They need monitoring on the scanner network and Wi-Fi.\n\nRoughly 120 users need support (drivers excluded). Budget around €45–50k for the first year. Decision by end of November, CFO Johan Berg signs."],
    ],
  },
  {
    title: "[Sample] New website for the clinic group",
    org: "Brightwell Dental Group",
    person: { name: "Aisha Rahman", email: "aisha@example.com" },
    value: 27000,
    notes: [
      [6, "Call with Aisha Rahman, marketing lead.\n\nFive dental clinics in Manchester and Leeds. Current site is 8 years old, not mobile-friendly, and online booking is a phone number. 60% of their traffic is mobile.\n\nMust-haves: online booking (they use Dentally), clinic pages with opening hours, a page per treatment. Launch before their sixth clinic opens in March."],
    ],
  },
  {
    title: "[Sample] Marketing retainer for spring launch",
    org: "Norrvik Bakery Co.",
    person: { name: "Elias Norrvik", email: "elias@example.com" },
    value: 15000,
    notes: [
      [4, "Met Elias Norrvik, founder.\n\nOrganic sourdough bakery, 4 cafés in Helsinki plus wholesale to 30 grocery stores. Launching a frozen bake-at-home range in April.\n\nInstagram is their main channel (12k followers), no newsletter yet. Tried paid social last year with an agency, 'lots of likes, no sales'. Wants a monthly partner for the launch and after. Thinking Core package, maybe Growth for the launch months."],
      [1, "Follow-up email from Elias: board approved a 3-month marketing budget. They want the newsletter started in February so it has subscribers by launch."],
    ],
  },
  {
    title: "[Sample] Project management system rollout",
    org: "Kestrel Architects",
    person: { name: "Tom Okafor", email: "tom.okafor@example.com" },
    value: 31000,
    notes: [
      [12, "Discovery call with Tom Okafor, studio director.\n\n45 architects in two studios (London, Bristol). Projects run on spreadsheets and email; they lost track of fee stages on two projects this year.\n\nChosen system: they are leaning to a project management tool with time tracking; need it connected to Xero for invoicing. 45 users, plus 5 admins to train."],
    ],
  },
  {
    title: "[Sample] Gym chain IT and Wi-Fi",
    org: "Lumen Fitness Studios",
    person: { name: "Sofia Marín", email: "sofia@example.com" },
    value: 22000,
    notes: [],
  },
];

const existing = (await pd("/v1/leads?limit=500")) ?? [];
for (const s of SAMPLES) {
  if (existing.some((l) => l.title === s.title)) {
    console.log("exists:", s.title);
    continue;
  }
  const org = await pd("/api/v2/organizations", "POST", { name: s.org });
  const person = await pd("/api/v2/persons", "POST", {
    name: s.person.name,
    org_id: org.id,
    emails: [{ value: s.person.email, primary: true, label: "work" }],
  });
  const lead = await pd("/v1/leads", "POST", {
    title: s.title,
    organization_id: org.id,
    person_id: person.id,
    value: { amount: s.value, currency: "EUR" },
  });
  for (const [ago, text] of s.notes) {
    const html = text.split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("");
    try {
      await pd("/v1/notes", "POST", { content: html, lead_id: lead.id, add_time: daysAgo(ago) });
    } catch {
      await pd("/v1/notes", "POST", { content: html, lead_id: lead.id });
    }
  }
  console.log("created:", s.title, lead.id);
}
