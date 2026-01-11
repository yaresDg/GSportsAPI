import mongoose from 'mongoose';
import ManualEvent from '../model/manualEventModel.js';
import AgendaEvent from '../model/agendaEventModel.js';
import redisClient from '../redisClient.js';

const getManualEvents=async (req,res)=>{
    try{
        const cacheKey='manualEvents_cache';
        try{
            const cachedData= await redisClient.get(cacheKey);
            if(cachedData){
                const eventosResponse=JSON.parse(cachedData);
                return res.json(eventosResponse);
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const eventos = await ManualEvent.find({},{__v: 0}).lean();
        try{
            await redisClient.set(cacheKey, JSON.stringify(eventos), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(eventos);
    }
    catch (error) {
        console.error('Error en getEvent:', error);
        return res.status(500).json({ error: 'Error al leer eventos.' });
    }
}

const getManualEventById=async(req,res)=>{
    const eventId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({'message': 'not found'});
    try{
        const cacheKey=`manualEvent_${eventId}`;
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
        const manualEvent=await ManualEvent.findById(eventId, {__v: 0}).lean();
        if(!manualEvent){
            return res.status(404).json({'message': 'not found'});
        }
        try{
            await redisClient.set(cacheKey,JSON.stringify(manualEvent),{EX: 3600});
            console.log(`Evento ${eventId} guardado en Redis`);
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(manualEvent);
    }
    catch(error){
        console.error('Error en getEventById:', error);
        return res.status(500).json({ error: 'Error al leer evento' });
    }
}

const postManualEvent=async (req,res)=>{
    const data= req.body;
    // Eliminar idEvent si viene vacío para que Mongoose use el default
    if (!data.idEvent || data.idEvent.trim() === '') {
        delete data.idEvent;
    }
    try{
        const newManualEvent= new ManualEvent(data);
        await newManualEvent.validate();
        const savedEvent= await newManualEvent.save();
        const agendaData = {
            idEvent: savedEvent.idEvent,
            strEvent: savedEvent.strEvent,
            strHomeTeam: savedEvent.strHomeTeam,
            strAwayTeam: savedEvent.strAwayTeam,
            strLeague: savedEvent.strLeague,
            idLeague: savedEvent.idLeague,
            strTimestamp: new Date(savedEvent.strTimestamp),
            station_ids: savedEvent.station_ids,
        };
        const newAgendaEvent= new AgendaEvent(agendaData);
        await newAgendaEvent.save();
        try{
            await redisClient.del('manualEvents_cache');
            await redisClient.del('agenda_cache');
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.status(201).json(savedEvent);
    }
    catch (error) {
        console.error('Error en postEventos:', error);
        return res.status(500).json({ error: 'Error al guardar evento' });
    }
}

const putManualEvent=async (req,res)=>{
    const eventId=req.params.id;
    const data=req.body;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({'message': 'not found'});
    try{
        // El idEvent NO debe cambiar una vez creado el evento
        if (data.idEvent !== undefined) {
        delete data.idEvent;
        }
        const updatedEvent = await ManualEvent.findByIdAndUpdate(
            eventId,
            data,
        { new: true, runValidators: true, projection: { __v: 0 } }).lean();
        if(!updatedEvent) return res.status(404).json({'message': 'not found'});
        await AgendaEvent.findOneAndUpdate(
            { idEvent: updatedEvent.idEvent },
            {
                strEvent: updatedEvent.strEvent,
                strHomeTeam: updatedEvent.strHomeTeam,
                strAwayTeam: updatedEvent.strAwayTeam,
                strLeague: updatedEvent.strLeague,
                idLeague: updatedEvent.idLeague,
                strTimestamp: new Date(updatedEvent.strTimestamp),
                station_ids: updatedEvent.station_ids,
            },
            { new: true }
        );
        try{
            await redisClient.del('manualEvents_cache');
            await redisClient.del(`manualEvent_${eventId}`);
            await redisClient.del('agenda_cache');
            await redisClient.set(`manualEvent_${eventId}`, JSON.stringify(updatedEvent), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(updatedEvent);
    }
    catch(error){
        console.error('Error en putEvent:', error);
        return res.status(500).json({ error: 'Error al actualizar evento' });
    }
}

const deleteManualEvent=async (req,res)=>{
    const eventId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({'message': 'not found'});
    try{
        const deletedEvent=await ManualEvent.findByIdAndDelete(eventId, { projection: { __v: 0, createdAt: 0, updatedAt: 0 }}).lean();
        if(!deletedEvent) return res.status(404).json({'message': 'not found'});
        await AgendaEvent.findOneAndDelete({ idEvent: deletedEvent.idEvent });
        try{
            await redisClient.del('manualEvents_cache');
            await redisClient.del(`manualEvent_${eventId}`);
            await redisClient.del('agenda_cache');
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(deletedEvent);
    }
    catch(error){
        console.error('Error en deleteEvent:', error);
        return res.status(500).json({ error: 'Error al eliminar evento' });
    }
}

export default { getManualEvents, getManualEventById, postManualEvent, putManualEvent, deleteManualEvent }