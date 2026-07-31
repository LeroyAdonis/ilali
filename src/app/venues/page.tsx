import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VenuesPageClient from "./client";
import { getVenues } from "@/lib/data-source";
import { mapVenue } from "@/lib/db/mappers";
import type { Venue } from "@/lib/types";

export const metadata: Metadata = {
  title: "Venues | ILALI",
  description:
    "Browse venues for children's activities in Cape Town. Studios, halls, outdoor spaces and more for your child's next activity.",
};

export default async function VenuesPage() {
  const dbVenues = await getVenues();
  const venues: Venue[] = dbVenues.map(mapVenue);

  return (
    <>
      <Header />
      <VenuesPageClient venues={venues} />
      <Footer />
    </>
  );
}
