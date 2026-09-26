export function formatSalary(min: number, max: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : `${currency} `;
  if (min === max) {
    if (min >= 1000) return `${sym}${Math.round(min / 1000)}k`;
    return `${sym}${min.toLocaleString()}`;
  }

  const minFormatted = min >= 1000 ? `${Math.round(min / 1000)}k` : min.toLocaleString();
  const maxFormatted = max >= 1000 ? `${Math.round(max / 1000)}k` : max.toLocaleString();
  return `${sym}${minFormatted} - ${sym}${maxFormatted}`;
}

export function formatJobType(type: string): string {
  switch (type) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "CONTRACT":
      return "Contract";
    case "INTERNSHIP":
      return "Internship";
    default:
      return type;
  }
}

export function formatLocationType(type: string): string {
  switch (type) {
    case "REMOTE":
      return "Remote";
    case "ONSITE":
      return "Onsite";
    case "HYBRID":
      return "Hybrid";
    default:
      return type;
  }
}

export function formatExperienceLevel(level: string): string {
  switch (level) {
    case "ENTRY":
      return "Entry Level";
    case "MID":
      return "Mid Level";
    case "SENIOR":
      return "Senior";
    case "LEAD":
      return "Lead / Staff";
    case "EXECUTIVE":
      return "Executive";
    default:
      return level;
  }
}

export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHour > 0) {
    return `${diffHour}h ago`;
  }
  if (diffMin > 0) {
    return `${diffMin}m ago`;
  }
  return "Just now";
}
