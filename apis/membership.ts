import { HttpRequest } from "@/utils/request";
import { siteUrl } from "@/config/site";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin`);

export const adminListMembershipPlans = async () => {
    const res = await appHttpRequest.get("/membership-plans");
    return res;
}

export const adminCreateMembershipPlan = async (data: Record<string, unknown>) => {
    const res = await appHttpRequest.post("/membership-plans", data);
    return res;
}

export const adminUpdateMembershipPlan = async (id: string, data: Record<string, unknown>) => {
    const res = await appHttpRequest.put("/membership-plans/" + id, data);
    return res;
}

export const adminDeleteMembershipPlan = async (id: string) => {
    const res = await appHttpRequest.del("/membership-plans/" + id);
    return res;
}

export const adminGrantMembership = async (data: Record<string, unknown>) => {
    const res = await appHttpRequest.post("/memberships/grant", data);
    return res;
}

export const adminRevokeMembership = async (id: string) => {
    const res = await appHttpRequest.del("/memberships/revoke" + id);
    return res;
}

export const adminListMemberships = async () => {
    const res = await appHttpRequest.get("/memberships");
    return res;
}

export const adminMembershipStats = async () => {
    const res = await appHttpRequest.get("/memberships/stats");
    return res;
}

export const adminSearchMembershipUsers = async (params: Record<string, unknown>) => {
    const res = await appHttpRequest.get("/memberships/search", params);
    return res;
}
