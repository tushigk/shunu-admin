import { HttpRequest } from "@/utils/request";
import { siteUrl } from "@/config/site";

const appHttpRequest = new HttpRequest(null, `${siteUrl}/admin`);

export interface ExperienceRule {
    _id: string;
    key: string;
    title: string;
    type: 'fixed' | 'rate';
    points: number;
    unitAmount?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserLevel {
    _id: string;
    level: number;
    title: string;
    requiredExp: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const adminListExperienceRules = async () => {
    const res = await appHttpRequest.get("/experience/rules");
    return res;
}

export const adminCreateExperienceRule = async (data: Partial<ExperienceRule>) => {
    const res = await appHttpRequest.post("/experience/rules", data)
    return res
}

export const adminUpdateExperienceRule = async (id: string, data: Partial<ExperienceRule>) => {
    const res = await appHttpRequest.put("/experience/rules/" + id, data)
    return res
}

export const adminDeleteExperienceRule = async (id: string) => {
    const res = await appHttpRequest.del("/experience/rules/" + id)
    return res
}

export const adminListUserLevels = async () => {
    const res = await appHttpRequest.get("/experience/levels")
    return res
}

export const adminCreateUserLevel = async (data: Partial<UserLevel>) => {
    const res = await appHttpRequest.post("/experience/levels", data)
    return res
}

export const adminUpdateUserLevel = async (id: string, data: Partial<UserLevel>) => {
    const res = await appHttpRequest.put("/experience/levels/" + id, data)
    return res
}

export const adminDeleteUserLevel = async (id: string) => {
    const res = await appHttpRequest.del("/experience/levels/" + id)
    return res
}

export const adminRecalculateUserLevels = async () => {
    const res = await appHttpRequest.post("/experience/levels/recalculate", {})
    return res
}

export const adminAdjustUserExp = async (userId: string, data: { amount: number; mode: 'add' | 'set'; note?: string }) => {
    const res = await appHttpRequest.post(`/experience/users/${userId}/adjust`, data)
    return res
}