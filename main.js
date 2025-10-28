import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import indexRoutes from './Routes/indexRoutes.js';

import dotenv from 'dotenv';

dotenv.config();


const app=express();
const port=3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(compression());
app.use('/',indexRoutes);

app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
});