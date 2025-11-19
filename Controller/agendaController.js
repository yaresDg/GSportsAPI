import mongoose from 'mongoose';
import AgendaEvent from '../model/agendaEventModel.js';
import redisClient from '../redisClient.js';
import { getEventDuration, parseEventDate, orderByRelevantEvents } from '../filters.js';

const getAgenda=async (req,res)=>{
    try{
        //Recibimos una query string con el tiempo y la zona horaria del cliente
        const clientTimeString=req.query.time || new Date().toISOString();
        const clientZoneString=req.query.zone || 'UTC';
        const cacheKey='agenda_cache';
        try{
            const cachedData= await redisClient.get(cacheKey);
            if (cachedData) {
                const allEvents = JSON.parse(cachedData);
                const relevantEventsResponse = orderByRelevantEvents(clientTimeString, clientZoneString, allEvents);
                console.log('Leyendo datos de redis...');
                return res.json(relevantEventsResponse);
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        console.log('Caché vacío. Leyendo la base de datos...');
        let allEvents=await AgendaEvent.find({},{__v: 0}).lean();
        try{
            await redisClient.set(cacheKey, JSON.stringify(allEvents), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const relevantEventsResponse=orderByRelevantEvents(clientTimeString,clientZoneString, allEvents);
        return res.json(relevantEventsResponse);
    }
    catch (error) {
        console.error('Error en getAgenda:', error);
        return res.status(500).json({ error: 'Error al leer la agenda' });
    }
}

const getAgendaById=async(req,res)=>{
    const eventId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({'message': 'not found'});
    try{
        const cacheKey=`agenda_event_${eventId}`;
        try{
            const cachedData=await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`Evento ${eventId} leído desde Redis`);
                return res.json(JSON.parse(cachedData));
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const event=await AgendaEvent.findById(eventId, {__v: 0}).lean();
        if(!event){
            return res.status(404).json({'message': 'not found'});
        }
        try{
            await redisClient.set(cacheKey,JSON.stringify(event),{EX: 3600});
            console.log(`Evento ${eventId} guardado en Redis`);
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(event);
    }
    catch(error){
        console.error('Error en getAgendaById:', error);
        return res.status(500).json({ error: 'Error al leer la agenda' });
    }
}

export default { getAgenda, getAgendaById }