import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import indexRoutes from './Routes/indexRoutes.js';
import connectDb from './db/connection.js';
import config from './config.js'
import passport from "./Auth/authStrategy.js";

const app=express();
const port=config.port;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(compression());
app.use(passport.initialize());
app.use('/',indexRoutes);

connectDb().then(()=>{
    app.listen(port,()=>{
        console.log(`Server is running at http://localhost:${port}`);
    });
});
