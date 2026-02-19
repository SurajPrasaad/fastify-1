import { z } from "zod";
import { privacyConfigSchema, updatePrivacySchema } from "./privacy.schema.js";

export type PrivacyConfigDto = z.infer<typeof privacyConfigSchema>;
export type UpdatePrivacyDto = z.infer<typeof updatePrivacySchema>;
