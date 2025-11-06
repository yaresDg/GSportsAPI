import {DateTime } from 'luxon';


//Calcula la duración estimada de un evento según el deporte
function getEventDuration(sport) {
    const sportType = sport || "";
    if (sportType.includes('Soccer') || sportType.includes('Champions')) {
        return 2.5 * 60 * 60 * 1000;
    }
    if (sportType.includes('Basketball')) {
        return 3 * 60 * 60 * 1000;
    }
    if (sportType.includes('Baseball') || sportType.includes('MLB')) {
        return 3.5 * 60 * 60 * 1000;
    }
    return 4 * 60 * 60 * 1000;
}

//Parsea la fecha del evento y la normaliza a UTC
function parseEventDate(event) {
    let ts = event.strTimestamp || (event.dateEvent && event.strTime ? `${event.dateEvent}T${event.strTime}` : null);
    if (!ts) return null;

    // Normalizar TODAS las fechas a UTC para evitar ambigüedades
    if (!/Z$|[+-]\d{2}:?\d{2}$/.test(ts)) {
        ts += 'Z';
    }
    
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function orderByRelevantEvents(clientTimeString,clientZoneString, allEvents){
    let baseDateTime;
    let clientTimeZone;
    if(clientTimeString){
        //Tenemos que calcular el inicio y fin del día según la zona horaria del cliente
        const clientDateTime= DateTime.fromISO(clientTimeString, { zone: clientZoneString });
        if(!clientDateTime.isValid){
            throw new Error(`Formato de clientTime inválido (${clientDateTime.invalidReason})`);
        }
        baseDateTime=clientDateTime;
        clientTimeZone=clientDateTime.zoneName;
    }
    else{
        baseDateTime=DateTime.utc();
        clientTimeZone='UTC';
    }
    const now=baseDateTime;
    const startOfDay= baseDateTime.startOf('day');
    const endOfDay= baseDateTime.endOf('day');
    //Ahora filtramos los eventos que ocurren en ese rango
    const relevantEvents=allEvents.filter(event=>{
        const startTime=parseEventDate(event);
        if(!startTime) return false;
        const eventStartInClientTZ = DateTime.fromJSDate(startTime, {zone: 'UTC'}).setZone(clientTimeZone);
        if (!eventStartInClientTZ.isValid) return false;
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
    return relevantEvents;
}

export { getEventDuration, parseEventDate, orderByRelevantEvents };