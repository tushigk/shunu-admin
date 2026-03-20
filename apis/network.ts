import { HttpRequest } from "@/utils/request";
import { siteUrl } from "@/config/site";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin/network`);

export const adminListNetworkPosts = async (params?: Record<string, unknown>) => {
    const res = await appHttpRequest.get("/posts", params);
    return res;
}
export const adminCreateNetworkPost = async (data: Record<string, unknown>) => {
    const res = await appHttpRequest.post("/posts", data);
    return res;
}
export const adminUpdateNetworkPost = async (id: string, data: Record<string, unknown>) => {
    const res = await appHttpRequest.put("/posts/" + id, data);
    return res;
}
export const adminDeleteNetworkPost = async (id: string) => {
    const res = await appHttpRequest.del("/posts/" + id);
    return res;
}
export const adminListNetworkReports = async (params?: Record<string, unknown>) => {
    const res = await appHttpRequest.get("/reports", params);
    return res;
}
export const adminResolveNetworkReport = async (id: string, data: Record<string, unknown>) => {
    const res = await appHttpRequest.put("/reports/" + id, data);
    return res;
}