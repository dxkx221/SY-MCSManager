import { useDefineApi } from "@/stores/useDefineApi";

export interface Announcement { id: string; title: string; content: string; active: boolean; createdAt: number; publisher: string; read?: boolean; }
export interface AnnouncementPayload { title: string; content: string; active: boolean; }

export const listAnnouncements = useDefineApi<any, Announcement[]>({ url: "/api/announcement", method: "GET" });
export const listUnreadAnnouncements = useDefineApi<any, Announcement[]>({ url: "/api/announcement/unread", method: "GET" });
export const createAnnouncement = useDefineApi<{ data: AnnouncementPayload }, Announcement>({ url: "/api/announcement", method: "POST" });
export const updateAnnouncement = (id: string) => useDefineApi<{ data: Partial<AnnouncementPayload> }, Announcement>({ url: `/api/announcement/${encodeURIComponent(id)}`, method: "PUT" });
export const deleteAnnouncement = (id: string) => useDefineApi<any, void>({ url: `/api/announcement/${encodeURIComponent(id)}`, method: "DELETE" });
export const markAnnouncementRead = useDefineApi<{ data: { id: string } }, boolean>({ url: "/api/announcement/read", method: "POST" });
