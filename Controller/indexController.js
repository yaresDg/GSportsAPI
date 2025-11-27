import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import redisClient from '../redisClient.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);



const getLigas=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'ligas.json');
    try{
        const cacheKey='ligas_cache';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const ligasResponse=JSON.parse(cachedData);
            return res.json(ligasResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const ligasResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(ligasResponse), { EX: 3600 });
        return res.json(ligasResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getLigas:', error);
        return res.status(500).json({ error: 'Error al leer ligas.' });
    }
}

const getRadiosMap=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'non-spanish-radios.json');
    try{
        const cacheKey='radios-map';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const radiosResponse=JSON.parse(cachedData);
            return res.json(radiosResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const radiosResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(radiosResponse), { EX: 3600 });
        return res.json(radiosResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getRadiosMap:', error);
        return res.status(500).json({ error: 'Error al leer no spanish radios.' });
    }
}

const getLeagueMap=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'league-map.json');
    try{
        const cacheKey='league-map';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const leagueResponse=JSON.parse(cachedData);
            return res.json(leagueResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const leagueResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(leagueResponse), { EX: 3600 });
        return res.json(leagueResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getLeagueMap:', error);
        return res.status(500).json({ error: 'Error al leer leagues.' });
    }
}

const getTeamMap=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'team-map.json');
    try{
        const cacheKey='team-map';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const teamResponse=JSON.parse(cachedData);
            return res.json(teamResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const teamResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(teamResponse), { EX: 3600 });
        return res.json(teamResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getTeamMap:', error);
        return res.status(500).json({ error: 'Error al leer teams.' });
    }
}

export default { getLigas, getRadiosMap, getLeagueMap, getTeamMap };