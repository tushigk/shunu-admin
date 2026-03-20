import { HttpRequest } from "@/utils/request";
import { siteUrl } from "@/config/site";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin`);

export const adminListBanners = async (params?: { page?: number; search?: string }) => {
    const res = await appHttpRequest.get("/banners", params);
    return res;
};

export const adminCreateBanner = async (data: Record<string, unknown>) => {
    const res = await appHttpRequest.post("/banners", data);
    return res;
};

export const adminUpdateBanner = async (id: string, data: Record<string, unknown>) => {
    const res = await appHttpRequest.put(`/banners/${id}`, data);
    return res;
};

export const adminDeleteBanner = async (id: string) => {
    const res = await appHttpRequest.del(`/banners/${id}`);
    return res;
};
