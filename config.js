import dotenv from 'dotenv';

dotenv.config();

const config={
    port: process.env.PORT || 3000,
    tokenSecret: process.env.TOKEN_SECRET
};

export default config;