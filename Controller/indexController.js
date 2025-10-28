import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {DateTime } from 'luxon';
import { getEventDuration, parseEventDate } from '../filters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);


const getAgenda=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'agenda-cache.json');
    try{
        if (!fsSync.existsSync(filePath)) {
            return res.status(503).json({ error: 'Agenda aún no está generada.' });
        }
        const data = await fs.readFile(filePath, 'utf-8');
        let allEvents=JSON.parse(data);
        //Recivimos una queryString con el tiempo del cliente
        const clientTimeString=req.query.time;
        const clientZoneString=req.query.zone || 'UTC';
        if(!clientTimeString){
            return res.json(allEvents);
        }
        //Tenemos que calcular el inicio y fin del día según la zona horaria del cliente
        const clientDateTime= DateTime.fromISO(clientTimeString, { zone: clientZoneString });
        if(!clientDateTime.isValid){
            return res.status(400).json({ 
                error: 'Formato de clientTime inválido. Use ISO 8601.',
                details: clientDateTime.invalidReason 
            });
        }
        const clientTimezone=clientDateTime.zoneName;
        const now=clientDateTime;
        const startOfDay= clientDateTime.startOf('day');
        const endOfDay= clientDateTime.endOf('day');
        //Ahora filtramos los eventos que ocurren en ese rango
        const relevantEvents=allEvents.filter(event=>{
            const startTime=parseEventDate(event);
            if(!startTime) return false;
            const eventStartInClientTZ = DateTime.fromJSDate(startTime, {zone: 'UTC'}).setZone(clientTimezone);
            if (!eventStartInClientTZ.isValid) {
                console.error(`Evento inválido: ${event.idEvent}`, eventStartInClientTZ.invalidReason);
                return false;
            }
            const durationInMillis=getEventDuration(event.strSport || event.strLeague)
            const eventEndInClientTZ = eventStartInClientTZ.plus({ milliseconds: durationInMillis });
            //Descartar eventos que hayan terminado
            if(eventEndInClientTZ < now) return false;
            const isWithinToday = eventStartInClientTZ >= startOfDay && eventStartInClientTZ <= endOfDay;
            const isOngoinFromYesterday = eventStartInClientTZ < startOfDay && eventEndInClientTZ > startOfDay;
            return isWithinToday || isOngoinFromYesterday;
        });
        //Hordenar por fecha
        relevantEvents.sort((a,b)=>{
            const ad = parseEventDate(a) || new Date(8640000000000000);
            const bd = parseEventDate(b) || new Date(8640000000000000);
            return ad - bd;
        });
        return res.json(relevantEvents);
    }
    catch (error) {
        console.error('Error en getAgenda:', error);
        return res.status(500).json({ error: 'Error al leer la agenda.' });
    }
}

const getRadios=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'radios.json');
    try{
        if (!fsSync.existsSync(filePath)) {
            return res.status(503).json({ error: 'Radios aún no está generado.' });
        }
        const data = await fs.readFile(filePath, 'utf-8');
        const radiosResponse=JSON.parse(data);
        return res.json(radiosResponse);
    }
    catch (error) {
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
        if(fsSync.existsSync(filePath)){
            const fileData=await fs.readFile(filePath, 'utf-8')
            radios=JSON.parse(fileData);
            }
        /*if (radios.find(r => r.id === newRadio.id)) {
            return res.status(409).json({ error: 'Ya existe una radio con ese ID' });
        }*/
        radios.push(newRadio);
        await fs.writeFile(filePath, JSON.stringify(radios,null,2));
        return res.status(201).json(newRadio);
    }
    catch (error) {
        console.error('Error en postRadios:', error);
        return res.status(500).json({ error: 'Error al guardar la nueva radio.' });
    }
}

const getEventos=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'eventos.json');
    try{
        if (!fsSync.existsSync(filePath)) {
            return res.status(503).json({ error: 'Eventos aún no está generado.' });
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const eventosResponse=JSON.parse(data);
        return res.json(eventosResponse);
    }
    catch (error) {
        console.error('Error en getEventos:', error);
        return res.status(500).json({ error: 'Error al leer eventos.' });
    }
}

const getLigas=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'ligas.json');
    try{
        if (!fsSync.existsSync(filePath)) {
            return res.status(503).json({ error: 'Ligas aún no está generada.' });
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const ligasResponse=JSON.parse(data);
        return res.json(ligasResponse);
    }
    catch (error) {
        console.error('Error en getLigas:', error);
        return res.status(500).json({ error: 'Error al leer ligas.' });
    }
}

const getNovedades=async (req,res)=>{
    const filePath = path.join(__dirname, '..', '..', 'godeanoSports', 'novedades.json');
    try{
        if (!fsSync.existsSync(filePath)) {
            return res.status(503).json({ error: 'Novedades aún no está generado.' });
        }
        const data =await fs.readFile(filePath, 'utf-8');
        const novedadesResponse=JSON.parse(data);
        return res.json(novedadesResponse);
    }
    catch (error) {
        console.error('Error en getNovedades:', error);
        return res.status(500).json({ error: 'Error al leer novedades.' });
    }
}

export default { getAgenda, getRadios, postRadios, getEventos, getLigas, getNovedades };