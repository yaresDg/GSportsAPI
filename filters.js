
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
    /*if (!/Z$|[+-]\d{2}:?\d{2}$/.test(ts)) {
        ts += 'Z';
    }*/
    
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export { getEventDuration, parseEventDate };