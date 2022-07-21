const maskString = (str: string) => {
  if (str.length === 1) {
    return "*";
  }
  if (str.length < 4) {
    return str.substring(0, 1) + "*".repeat(str.length - 1);
  }
  return (
    str.substring(0, 1) +
    "*".repeat(str.length - 2) +
    str.substring(str.length - 1)
  );
};

export const maskEmail = (email: string) => {
  const [username, domainDotcom] = email.split("@");
  if (!username || !domainDotcom) return "";
  const [domain, com] = domainDotcom.split(".");
  if (!domain) return "";
  return `${maskString(username)}@${maskString(domain)}.${com}`;
};
