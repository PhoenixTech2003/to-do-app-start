/**
 * Converts a Date object to an ISO string in CAT (Central Africa Time, UTC+2) timezone
 * The date is formatted with the CAT timezone offset (+02:00) to preserve the local time
 * @param date - The date to convert
 * @returns ISO string with CAT timezone offset (+02:00)
 */
export function toCATISOString(date: Date): string {
  // Get the local date components (these represent what the user selected)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')

  // Format as ISO string with CAT offset (+02:00)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+02:00`
}
