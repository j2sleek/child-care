export const toLocalTime = (iso) => new Date(iso).toLocaleString();
export const toUTC = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000);
