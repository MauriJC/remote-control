export const verifyToken = (receivedToken: string, expectedToken: string) => {
  return receivedToken === expectedToken;
};
