import { siteUrl } from "@/config/site";
import { HttpRequest } from "@/utils/request";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin`);

export const adminDashboardStats = async (params?: Record<string, unknown>) => {
    const res = await appHttpRequest.get("/dashboard/stats", params);
    return res;
}
