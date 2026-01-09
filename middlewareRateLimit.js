import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 2, // máximo 2 intentos
    message: {
        message: 'Demasiados intentos de login. Por favor, intenta de nuevo en 1 minuto.'
    },
    standardHeaders: true, // Devuelve info de rate limit en headers
    legacyHeaders: false,
    // Opcional: usar IP de usuario (útil si estás detrás de un proxy)
    skipSuccessfulRequests: false, // Cuenta incluso requests exitosos
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por hora
    message: {
        message: 'Demasiados intentos de registro. Por favor, intenta de nuevo en 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
