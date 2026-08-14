import { IlaliSpinner } from "@/components/IlaliSpinner";

/**
 * Root loading UI — shows the brand spinner whenever the app is waiting
 * on a route transition / server data during navigation. Rendered inside
 * the app layout, replaces the old white flash with a branded moment.
 */
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-paper/80 backdrop-blur-[1px]">
      <IlaliSpinner size="md" label="Loading" />
    </div>
  );
}
