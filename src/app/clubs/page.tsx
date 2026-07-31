import { redirect } from "next/navigation";

// Every provider is a club — the club index lives in the browse experience.
export default function ClubsIndex() {
  redirect("/browse");
}
