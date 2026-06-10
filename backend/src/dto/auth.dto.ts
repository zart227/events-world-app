import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export type CredentialsDto = z.infer<typeof credentialsSchema>;

export interface UserDto {
  id: string;
  email: string;
}
