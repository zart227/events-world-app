import { z } from 'zod';

export const pollutionComponentsSchema = z.object({
  co: z.number(),
  no: z.number(),
  no2: z.number(),
  o3: z.number(),
  so2: z.number(),
  pm2_5: z.number(),
  pm10: z.number(),
  nh3: z.number(),
});

export const savePollutionSchema = z.object({
  address: z.string().min(1),
  latitude: z.coerce.string(),
  longitude: z.coerce.string(),
  components: pollutionComponentsSchema,
  aqi: z.number().int().min(1).max(5),
  dateTime: z.string().min(1),
});

export type PollutionComponentsDto = z.infer<typeof pollutionComponentsSchema>;
export type SavePollutionDto = z.infer<typeof savePollutionSchema>;

export interface PollutionRecordDto extends SavePollutionDto {
  id: string;
  created_at: string;
}
