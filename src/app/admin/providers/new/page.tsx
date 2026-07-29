import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providers, providerApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// CT suburb options
const CT_SUBURBS = [
  "Athlone", "Bellville", "Bishopscourt", "Camps Bay", "Claremont",
  "Constantia", "Durbanville", "Fish Hoek", "Gardens", "Green Point",
  "Hout Bay", "Kenilworth", "Milnerton", "Muizenberg", "Newlands",
  "Observatory", "Pinelands", "Rondebosch", "Sea Point", "Simon's Town",
  "Somerset West", "Stellenbosch", "Strand", "Table View", "Tokai",
  "Vredehoek", "Woodstock", "Wynberg",
];

const ACTIVITY_TAGS = [
  "Outdoor", "Indoor", "Creative", "Sport", "Music", "Dance", "Art",
  "STEM", "Coding", "Language", "Nature", "Water", "Team", "Individual",
  "High Energy", "Calm", "Structured", "Free Play", "Competitive",
];

export default async function NewProviderPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    redirect("/");
  }

  const { applicationId } = await searchParams;

  // Pre-fill from application if available
  let prefill: Partial<{
    name: string;
    providerName: string;
    location: string;
    ageMin: number;
    ageMax: number;
    priceValue: number;
    imageUrl: string;
    phone: string;
    description: string;
  }> = {};

  if (applicationId) {
    const [app] = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.id, applicationId));

    if (app) {
      prefill = {
        name: app.name,
        providerName: app.name,
        location: app.location || "",
        ageMin: app.ageMin || 5,
        ageMax: app.ageMax || 12,
        priceValue: app.priceValue || 0,
        imageUrl: app.imageUrl || "",
        phone: app.phone || "",
        description: app.description || "",
      };
    }
  }

  async function createProvider(formData: FormData) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return;

    const slug = slugify(String(formData.get("name") || ""));
    const tags = formData.getAll("tags").map(String);

    await db.insert(providers).values({
      name: String(formData.get("name") || ""),
      slug,
      category: String(formData.get("category") || ""),
      description: String(formData.get("description") || ""),
      providerName: String(formData.get("providerName") || ""),
      location: String(formData.get("location") || ""),
      ageMin: Number(formData.get("ageMin")) || 0,
      ageMax: Number(formData.get("ageMax")) || 0,
      priceValue: Number(formData.get("priceValue")) || 0,
      priceLabel: String(formData.get("priceLabel") || "per session"),
      imageUrl: String(formData.get("imageUrl") || ""),
      phone: String(formData.get("phone") || ""),
      tags: tags.length > 0 ? tags : null,
      verified: formData.get("verified") === "on",
      featured: formData.get("featured") === "on",
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Provider Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a new activity provider to the ILALI platform.
        </p>
      </div>

      <form action={createProvider} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Basic Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Activity Name *
              </label>
              <input
                name="name"
                required
                defaultValue={prefill.name}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Provider Name *
              </label>
              <input
                name="providerName"
                required
                defaultValue={prefill.providerName}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Slug
              </label>
              <input
                name="slug"
                defaultValue={slugify(prefill.name || "")}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              <p className="mt-1 text-xs text-slate-400">
                Auto-generated from name
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Category *
              </label>
              <select
                name="category"
                required
                defaultValue="sports"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              >
                <option value="sports">⚽ Sports</option>
                <option value="arts-crafts">🎨 Arts & Crafts</option>
                <option value="music">🎵 Music</option>
                <option value="dance">💃 Dance</option>
                <option value="stem">🔬 STEM</option>
                <option value="language">🗣️ Language</option>
                <option value="outdoor">🏕️ Outdoor</option>
                <option value="cooking">🍳 Cooking</option>
                <option value="martial-arts">🥋 Martial Arts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Location *
              </label>
              <select
                name="location"
                required
                defaultValue={prefill.location || "Claremont"}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              >
                <option value="">Select suburb</option>
                {CT_SUBURBS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={prefill.description}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
        </div>

        {/* Age & Pricing */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Age & Pricing
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Min Age *
              </label>
              <input
                name="ageMin"
                type="number"
                min={0}
                max={18}
                required
                defaultValue={prefill.ageMin || 5}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Max Age *
              </label>
              <input
                name="ageMax"
                type="number"
                min={0}
                max={18}
                required
                defaultValue={prefill.ageMax || 12}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Price (Rands) *
              </label>
              <input
                name="priceValue"
                type="number"
                min={0}
                step={0.01}
                required
                defaultValue={
                  prefill.priceValue
                    ? (prefill.priceValue / 100).toFixed(2)
                    : "0.00"
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              <p className="mt-1 text-xs text-slate-400">
                Stored in cents. E.g., 150.00 = R150.00
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Price Label
            </label>
            <input
              name="priceLabel"
              defaultValue="per session"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
        </div>

        {/* Media & Contact */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Media & Contact
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Image URL
              </label>
              <input
                name="imageUrl"
                type="url"
                defaultValue={prefill.imageUrl}
                placeholder="https://example.com/image.jpg"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={prefill.phone}
                placeholder="+27XXXXXXXXX"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TAGS.map((tag) => (
              <label
                key={tag}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.toLowerCase()}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-ilali-600 focus:ring-ilali-500"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        {/* Flags */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Settings
          </h2>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="verified"
                className="h-4 w-4 rounded border-slate-300 text-ilali-600 focus:ring-ilali-500"
              />
              <span className="text-sm text-slate-700">Verified</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                className="h-4 w-4 rounded border-slate-300 text-ilali-600 focus:ring-ilali-500"
              />
              <span className="text-sm text-slate-700">Featured</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <a
            href="/admin/providers"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="rounded-lg bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
          >
            Create Provider
          </button>
        </div>
      </form>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
