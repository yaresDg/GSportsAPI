import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);


const getRadios=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'radios.json');
    try{
        const cacheKey='radios_cache';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const radiosResponse=JSON.parse(cachedData);
            return res.json(radiosResponse);
        }
        const data = await fs.readFile(filePath, 'utf-8');
        const radiosResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(radiosResponse), { EX: 3600 });
        return res.json(radiosResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getRadios:', error);
        return res.status(500).json({ error: 'Error al leer radios.' });
    }
}

const postRadios=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'radios.json');
    const newRadio={
        id: req.body.id,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        pais: req.body.pais,
        id_thesportsdb: req.body.id_thesportsdb,
        streams: req.body.streams
    };
    try{
        let radios=[];
        //if(fsSync.existsSync(filePath)){
            const fileData=await fs.readFile(filePath, 'utf-8')
            radios=JSON.parse(fileData);
        //}
        /*if (radios.find(r => r.id === newRadio.id)) {
            return res.status(409).json({ error: 'Ya existe una radio con ese ID' });
        }*/
        radios.push(newRadio);
        await fs.writeFile(filePath, JSON.stringify(radios,null,2));
        return res.status(201).json(newRadio);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en postRadios:', error);
        return res.status(500).json({ error: 'Error al guardar la nueva radio.' });
    }
}

const getEventos=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'eventos.json');
    try{
        const cacheKey='eventos_cache';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const eventosResponse=JSON.parse(cachedData);
            return res.json(eventosResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const eventosResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(eventosResponse), { EX: 3600 });
        return res.json(eventosResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getEventos:', error);
        return res.status(500).json({ error: 'Error al leer eventos.' });
    }
}

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

const getNovedades=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'novedades.json');
    try{
        const cacheKey='novedades_cache';
        const cachedData= await redisClient.get(cacheKey);
        if(cachedData){
            const novedadesResponse=JSON.parse(cachedData);
            return res.json(novedadesResponse);
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const novedadesResponse=JSON.parse(data);
        await redisClient.set(cacheKey, JSON.stringify(novedadesResponse), { EX: 3600 });
        return res.json(novedadesResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getNovedades:', error);
        return res.status(500).json({ error: 'Error al leer novedades.' });
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

export default {  getRadios, postRadios, getEventos, getLigas, getNovedades, getRadiosMap, getLeagueMap, getTeamMap };