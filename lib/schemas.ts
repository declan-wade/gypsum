import * as z from "zod"

export const urlSchema = z.union([
  z.literal(""),
  z
    .string()
    .transform((val) => (/^https?:\/\//i.test(val) ? val : `https://${val}`))
    .pipe(z.string().url("Please enter a valid URL.")),
])
