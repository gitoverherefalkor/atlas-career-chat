// Referral-link capture utilities.
//
// An invitee arrives via a link like `https://cairnly.io/?ref=ABCD2345`.
// We stash the code in localStorage so it survives navigation to the payment
// form, then pass it to `create-checkout` to pre-apply the 25% discount.

const REFERRAL_STORAGE_KEY = 'cairnly_referral_code';

/**
 * Reads `?ref=CODE` from the current URL, stores it, and strips it from the
 * address bar. Call once on app mount.
 */
export function captureReferralFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.trim()) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim());
      params.delete('ref');
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch {
    // localStorage unavailable (private mode / blocked) — referral is optional.
  }
}

/** Returns the stored referral code, or null if none was captured. */
export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clears the stored referral code (call after a successful purchase). */
export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
