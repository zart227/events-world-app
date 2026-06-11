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

export const currentPollutionQuerySchema = z
  .object({
    city: z.string().trim().min(2).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    address: z.string().trim().min(1).optional(),
  })
  .refine((q) => q.city !== undefined || (q.lat !== undefined && q.lon !== undefined), {
    message: 'Укажите ?city= либо ?lat=&lon=',
  });

export type PollutionComponentsDto = z.infer<typeof pollutionComponentsSchema>;
export type SavePollutionDto = z.infer<typeof savePollutionSchema>;
export type CurrentPollutionQueryDto = z.infer<typeof currentPollutionQuerySchema>;

export interface PollutionRecordDto extends SavePollutionDto {
  id: string;
  created_at: string;
}

export interface CurrentPollutionDto {
  address: string;
  latitude: string;
  longitude: string;
  components: PollutionComponentsDto;
  aqi: number;
  dateTime: string;
  /** Время измерения по данным OWM (unix-секунды) */
  measuredAt: number;
}
