import fs from "fs";
const BASE = "http://localhost:3001";
const jar = "/tmp/ilali-cookies.txt";

async function req(path, opts = {}) {
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
  if (setCookie) fs.writeFileSync(jar, setCookie.split(";")[0]);
  try { return { status: res.status, body: await res.json() }; }
  catch { return { status: res.status, body: null }; }
}

await req("/api/auth/get-session");
const signin = await req("/api/auth/sign-in/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "leroy@ilali.co", password: "ilali-admin-2026" }),
});
console.log("SIGNIN:", signin.status);

const appsRes = await fetch(BASE + "/api/admin/applications", {
  headers: { cookie: fs.readFileSync(jar, "utf8").trim() },
});
const apps = await appsRes.json();
const approved = apps.find((a) => a.status === "approved");
console.log("APPROVED app:", approved ? approved.name : "(none in DB)");

if (approved) {
  const patch = await req(`/api/admin/applications/${approved.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { name: "HACK", activityType: "Hack" } }),
  });
  console.log("PATCH on APPROVED (expect 400):", patch.status, patch.body?.error);
}

// Also verify no-fields PATCH on approved still works (temp password path untouched)
if (approved) {
  const patch2 = await req(`/api/admin/applications/${approved.id}`, {
    method: "PATCH",
  });
  console.log("PATCH empty on APPROVED (temp pw path):", patch2.status, patch2.body?.tempPassword ? "tempPassword ✅" : patch2.body?.error || "no temp pw");
}
console.log("DONE");
