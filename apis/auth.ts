import { siteUrl } from "@/config/site";
import { HttpRequest } from "@/utils/request";

const appHttpRequest = new HttpRequest(null, siteUrl);

export const login = async (data: Record<string, unknown>) => {
  const res = await appHttpRequest.post("/auth/login", data);
  return res;
};

export const register = async (data: Record<string, unknown>) => {
  const res = await appHttpRequest.post("/auth/register", data);
  return res;
};
