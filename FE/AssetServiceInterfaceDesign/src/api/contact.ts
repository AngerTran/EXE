import { apiRequest } from "./client";

export interface ContactInquiryBody {
  name: string;
  email: string;
  phone?: string;
  gameIdea?: string;
  consultType: string;
  message: string;
}

export async function submitContact(body: ContactInquiryBody): Promise<void> {
  await apiRequest<void>("/contact", {
    auth: false,
    method: "POST",
    body: JSON.stringify(body),
  });
}
