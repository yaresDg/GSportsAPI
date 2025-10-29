import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEventDuration, parseEventDate, orderByRelevantEvents } from '../filters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);


const getAgenda=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'agenda-cache.json');
    try{
        const data = await fs.readFile(filePath, 'utf-8');
        let allEvents=JSON.parse(data);
        //Recivimos una queryString con el tiempo y la zona horaria del cliente
        const clientTimeString=req.query.time || new Date().toISOString();
        const clientZoneString=req.query.zone || 'UTC';
        const relevantEventsResponse=orderByRelevantEvents(clientTimeString,clientZoneString, allEvents);
        return res.json(relevantEventsResponse);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(503).json({ error: 'Archivo no encontrado.' });
        }
        console.error('Error en getAgenda:', error);
        return res.status(500).json({ error: 'Error al leer la agenda.' });
    }
}

const getRadios=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'radios.json');
    try{
        const data = await fs.readFile(filePath, 'utf-8');
        const radiosResponse=JSON.parse(data);
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
        const data =await fs.readFile(filePath, 'utf-8');
        const eventosResponse=JSON.parse(data);
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
        const data =await fs.readFile(filePath, 'utf-8');
        const ligasResponse=JSON.parse(data);
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
        const data =await fs.readFile(filePath, 'utf-8');
        const novedadesResponse=JSON.parse(data);
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

export default { getAgenda, getRadios, postRadios, getEventos, getLigas, getNovedades };