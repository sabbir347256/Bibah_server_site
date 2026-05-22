export const sanitizeUser = (user: any) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};