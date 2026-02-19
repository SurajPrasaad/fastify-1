import { z } from "zod";
import { blockParamsSchema } from "./block.schema.js";

export type BlockParamsDto = z.infer<typeof blockParamsSchema>;
