import { User } from "@/components/providers/AuthProvider";
import { HttpRequest } from "@/utils/request";
import { siteUrl } from "@/config/site";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin/users`);

export const getUsers = async ({ page, search, payment }: { page: number, search?: string, payment?: string }) => {
  const res = await appHttpRequest.get("", { page, search, payment });
  return res;
}

export const editUser = async (data: User, id: string) => {
  const res = await appHttpRequest.put("/" + id, data);
  return res
}

export const adminCreateUser = async (data: User) => {
  const res = await appHttpRequest.post("", data);
  return res
}

export const deleteUser = async (id: string) => {
  const res = await appHttpRequest.del("/" + id);
  return res;
}

export const me = async () => {
  try {
    const res = await appHttpRequest.get("/me");
    return res?.user || res;
  } catch (err) {
    throw err;
  }
};
export const me2 = async () => {
  try {
    const res = await appHttpRequest.get("/me");
    return res?.user || res;
  } catch (err) {
    throw err;
  }
};

export const updateAvatar = async (formData: FormData, id: string) => {
  const res = await appHttpRequest.post(`/${id}/avatar`, formData);
  return res;
};
