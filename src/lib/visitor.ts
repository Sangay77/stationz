const KEY = "stationz_visitor_key";

export function getVisitorKey() {
  if (typeof window === "undefined") return "anonymous";
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(KEY, key);
  }
  return key;
}
