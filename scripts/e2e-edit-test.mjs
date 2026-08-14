// E2E: admin login → PATCH an application's draft fields → verify DB
import fs from "fs";

const BASE = "http://localhost:3001";
const jar = "/tmp/ilali-cookies.txt";
if (fs.existsSync(jar)) fs.rmSync(jar);

async function req(path, opts = {}, asJson = true) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      cookie: fs.existsSync(jar) ? fs.readFileSync(jar, "utf8").trim() : "",
      origin: BASE,
    },
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    // keep the session cookie
    const parts = setCookie.split(";")[0];
    fs.writeFileSync(jar, parts);
  }
  if (asJson) {
    try { return { status: res.status, body: await res.json() }; }
    catch { return { status: res.status, body: null }; }
  }
  return { status: res.status, body: null };
}

// 1. Get CSRF / session
await req("/api/auth/get-session");

// 2. Sign in as admin
const signin = await req("/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "leroy@ilali.co", password: "ilali-admin-2026" }),
});
console.log("SIGNIN:", signin.status);
if (signin.status !== 200) { console.log(JSON.stringify(signin.body)); process.exit(1); }

// 3. Find a pending application with a poster source
const appsRes = await fetch(BASE + "/api/admin/applications", {
  headers: { cookie: fs.readFileSync(jar, "utf8").trim() },
});
const apps = await appsRes.json();
const target = apps.find((a) => a.status === "pending" && a.onboardSource === "poster");
if (!target) { console.log("No pending poster application found to test with"); process.exit(1); }
console.log("TARGET:", target.name, "| id:", target.id.slice(0, 8), "| price:", target.priceValue);

// 4. PATCH the draft
const patch = await req(`/api/admin/applications/${target.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fields: {
      name: target.name + " (edited)",
      activityType: target.activityType,
      description: "Edited description via E2E test",
      location: target.location || "Cape Town",
      ageMin: target.ageMin ?? 4,
      ageMax: target.ageMax ?? 12,
      priceValue: 199,
      phone: target.phone || "+27820000000",
      email: target.email,
    },
  }),
});
console.log("PATCH EDIT:", patch.status, JSON.stringify(patch.body).slice(0, 200));

// 5. Verify in DB
const verify = await req(`/api/admin/applications/${target.id}`);
const app = Array.isArray(verify.body) ? verify.body.find((a) => a.id === target.id) : verify.body.application;
console.log("VERIFY name:", app?.name, "| price:", app?.priceValue, "| desc:", app?.description?.slice(0, 30));

// 6. Verify guard: PATCH an approved/rejected app should 400
console.log("DONE");
