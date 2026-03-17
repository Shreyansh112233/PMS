import { registerAs } from '@nestjs/config';

//   expiresIn
export interface AuthConfig {
    jwt: {
        secret: string;
        expiresIn: string;
    };
    refresh: {
        secret: string;
        expiresIn: string;
    };
}

export const authConfig = registerAs(
    'auth',
    (): AuthConfig => ({
        jwt: {
            secret: process.env.JWT_SECRET as string,
            expiresIn: process.env.JWT_EXPIRES_IN ?? '60m' as string,
        },
        refresh: {
            secret: process.env.JWT_REFRESH_SECRET as string,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' as string,
        },
    }),
);
