/**
 * Formats a South African phone number to the display format:
 *   +27 XX XXX XXXX
 *
 * Handles inputs like:
 *   - 0821234567 → +27 82 123 4567
 *   - +27821234567 → +27 82 123 4567
 *   - 27821234567 → +27 82 123 4567
 *
 * Returns partial output for incomplete numbers so the user
 * sees formatting as they type.
 */
export function formatPhone(value: string): string {
  // Strip everything except digits and +
  let digits = value.replace(/[^\d+]/g, "");

  // Ensure +27 prefix
  if (!digits.startsWith("+")) {
    if (digits.startsWith("27")) {
      digits = "+" + digits;
    } else if (digits.startsWith("0")) {
      digits = "+27" + digits.slice(1);
    } else {
      digits = "+27" + digits;
    }
  }

  // Format: +27 XX XXX XXXX
  const cleaned = digits.replace(/^\+27/, "");
  if (cleaned.length >= 9) {
    return `+27 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)}`;
  }
  if (cleaned.length >= 5) {
    return `+27 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}${cleaned.slice(5) ? " " + cleaned.slice(5) : ""}`;
  }
  if (cleaned.length >= 2) {
    return `+27 ${cleaned.slice(0, 2)}${cleaned.slice(2) ? " " + cleaned.slice(2) : ""}`;
  }
  if (cleaned.length === 1) {
    return `+27 ${cleaned}`;
  }

  return digits; // partial — don't force format on incomplete input
}
