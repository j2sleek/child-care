export const toLocalTime = (iso: string) => new Date(iso).toLocaleString();
export const toUTC = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000);