// agenda.js
// VERSIÓN FINAL Y ROBUSTA v4.8 (Lógica TUDN y Scraper de YouTube corregidos)

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import redisClient from './redisClient.js';
import dotenv from 'dotenv';


dotenv.config();

// --- CONFIGURACIÓN PRINCIPAL ---
const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const HOT_SPORTS_YOUTUBE_CHANNEL_ID = "UC4tBHwQc6J2jlXKvL2kpWgQ";
const HOT_SPORTS_STATION_ID = 'hot_sports'; 

const OUTPUT_FILE_PATH = path.resolve(process.cwd(), '..', 'godeanoSports', 'agenda-cache.json');
const MANUAL_EVENTS_PATH = path.resolve(process.cwd(), '..', 'godeanoSports', 'eventos.json');
const MANUAL_RADIOS_PATH = path.resolve(process.cwd(), '..', 'godeanoSports', 'radios.json');

const SUPER7_STATION_ID = 'la_super_7_fm';
const TUDN_STATION_ID_GENERIC = 'tudn_radio_usa';
const F1_TEAM_ID_FOR_SCHEDULE = '135706';
const FORMULA1_LEAGUE_ID = '4370';
const CHAMPIONS_LEAGUE_ID = '4480';
const CUBAN_LEAGUE_ID = '5108';

const RADIO_REBELDE_STATION_ID = 'radio_rebelde';
const CUBAN_LEAGUE_TEAM_IDS = new Set(["140173", "152263", "144269", "144279", "144280", "144266", "144271", "144272", "144273", "144274", "144275", "144276", "144277", "144278", "144265", "144267", "144268", "144270"]);

const CHAMPIONS_LEAGUE_STATION_IDS = [TUDN_STATION_ID_GENERIC, 'emisoras_unidas_gt', 'la_red_gt', 'kwkw_tu_liga_radio', 'union_radio_ve'];

const TUDN_NETWORK_STATIONS = ['kwkw_tu_liga_radio', 'golden_knights_spanish', 'wrto_chicago', 'espn_west_palm'];

const MLB_TEAM_IDS_THESPORTSDB = new Set(['135252', '135269', '135256', '135258', '135272', '135273', '135275', '135278', '135279', '135280', '135263', '135264', '135281', '135268', '135260', '135270', '135253', '135251', '135271', '135267', '135265', '135274', '135277', '135276', '135255', '135257', '135259', '135261']);
const MLB_ID_TO_THESPORTSDB_ID_MAP = { 139: '135263', 112: '135269', 110: '135251', 141: '135265', 134: '135277', 120: '135281', 140: '135264', 121: '135275', 116: '135255', 146: '135273', 147: '135260', 111: '135252', 118: '135257', 143: '135276', 145: '135253', 114: '135254', 109: '135267', 142: '135259', 117: '135256', 144: '135268', 138: '135280', 158: '135274', 115: '135271', 135: '135278', 119: '135272', 137: '135279', 108: '135258', 136: '135260', 113: '135270', 133: '135261' };

// ===================================================================================
// --- DICCIONARIOS Y AYUDANTES ---
// ===================================================================================

const F1_GRAND_PRIX_MAP = { "Bahrain Grand Prix": "Gran Premio de Baréin", "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudita", "Australian Grand Prix": "Gran Premio de Australia", "Japanese Grand Prix": "Gran Premio de Japón", "Chinese Grand Prix": "Gran Premio de China", "Miami Grand Prix": "Gran Premio de Miami", "Emilia Romagna Grand Prix": "Gran Premio de Emilia-Romaña", "Monaco Grand Prix": "Gran Premio de Mónaco", "Canadian Grand Prix": "Gran Premio de Canadá", "Spanish Grand Prix": "Gran Premio de España", "Austrian Grand Prix": "Gran Premio de Austria", "British Grand Prix": "Gran Premio de Gran Bretaña", "Hungarian Grand Prix": "Gran Premio de Hungría", "Belgian Grand Prix": "Gran Premio de Bélgica", "Dutch Grand Prix": "Gran Premio de los Países Bajos", "Italian Grand Prix": "Gran Premio de Italia", "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán", "Singapore Grand Prix": "Gran Premio de Singapur", "United States Grand Prix": "Gran Premio de los Estados Unidos", "Mexico City Grand Prix": "Gran Premio de la Ciudad de México", "Sao Paulo Grand Prix": "Gran Premio de São Paulo", "Las Vegas Grand Prix": "Gran Premio de Las Vegas", "Qatar Grand Prix": "Gran Premio de Qatar", "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi" };

function getEventDuration(sport){
    const sportType = sport || ""; 
    if (sportType.includes('Soccer') || sportType.includes('Champions')) return 2.5 * 60 * 60 * 1000; 
    if (sportType.includes('Basketball')) return 3 * 60 * 60 * 1000;
    if (sportType.includes('Baseball') || sportType.includes('MLB')) return 3.5 * 60 * 60 * 1000;  
    return 4 * 60 * 60 * 1000; 
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function normalizeText(text){
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/vs\.?|@|en vivo|directo/g, ''); 
}
function transformMlbEvent(game){
    const homeTeamId = MLB_ID_TO_THESPORTSDB_ID_MAP[game.teams.home.team.id];
    const awayTeamId = MLB_ID_TO_THESPORTSDB_ID_MAP[game.teams.away.team.id];
    if (!homeTeamId || !awayTeamId) return null;
    return { idEvent: String(game.gamePk), strEvent: `${game.teams.home.team.name} vs ${game.teams.away.team.name}`, idLeague: "4424", strLeague: "MLB", strHomeTeam: game.teams.home.team.name, strAwayTeam: game.teams.away.team.name, idHomeTeam: homeTeamId, idAwayTeam: awayTeamId, strTimestamp: game.gameDate, dateEvent: game.officialDate, strStatus: game.status.codedGameState };
}

async function fetchMlbGames() {
    console.log("Buscando partidos de la MLB con la API oficial...");
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    const urls = [`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`, `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${tomorrow}`];
    let mlbEvents = [];
    for (const url of urls) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.dates && data.dates.length > 0) {
                const games = data.dates[0].games;
                const transformedGames = games.map(transformMlbEvent).filter(Boolean);
                mlbEvents.push(...transformedGames);
            }
        }
        catch (error) {
            console.error(`Error de red al buscar en la API de la MLB (${url}):`, error.message);
        }
    }
    console.log(`Se encontraron ${mlbEvents.length} partidos de la MLB para hoy y mañana.`);
    return mlbEvents;
}

// ===================================================================================
// --- SCRAPER DE YOUTUBE (VERSIÓN MEJORADA) ---
// ===================================================================================

async function fetchAndAssignYoutubeStreams(events) {
    console.log("\n--- Iniciando Scraper de YouTube para Hot Sports ---");
    if (!YOUTUBE_API_KEY) {
        console.warn("ADVERTENCIA: No se proporcionó YOUTUBE_API_KEY. Saltando scraper de YouTube.");
        return events;
    }
    try {
        const youtube = google.youtube('v3');
        const response = await youtube.search.list({
            part: 'snippet',
            channelId: HOT_SPORTS_YOUTUBE_CHANNEL_ID,
            eventType: 'upcoming',
            type: 'video',
            key: YOUTUBE_API_KEY,
        });
        const upcomingStreams = response.data.items;
        if (!upcomingStreams || upcomingStreams.length === 0) {
            console.log("Hot Sports: No se encontraron streams programados en el canal de YouTube.");
            return events;
        }
        console.log(`Hot Sports: Se encontraron ${upcomingStreams.length} streams programados. Analizando títulos...`);
        // Función interna para obtener el nombre clave de un equipo de MLB
        const getMlbShortName = (fullTeamName) => {
            if (!fullTeamName) return null;
            const normalized = normalizeText(fullTeamName);
            // Casos especiales de dos palabras
            if (normalized.includes("blue jays")) return "blue jays";
            if (normalized.includes("red sox")) return "red sox";
            if (normalized.includes("white sox")) return "white sox";
            // Caso general: tomar la última palabra (funciona para "Brewers", "Cubs", "Yankees", etc.)
            return normalized.split(' ').pop();
        };
        upcomingStreams.forEach(stream => {
            const normalizedTitle = normalizeText(stream.snippet.title);
            for (const event of events) {
                // Solo aplicar a partidos de la MLB
                if (String(event.idLeague) !== '4424') continue;
                const homeShortName = getMlbShortName(event.strHomeTeam);
                const awayShortName = getMlbShortName(event.strAwayTeam);
                // Comprobar si el título contiene AMBOS nombres clave
                if (homeShortName && awayShortName && normalizedTitle.includes(homeShortName) && normalizedTitle.includes(awayShortName)) {
                    if (!Array.isArray(event.station_ids)) {
                        event.station_ids = [];
                    }
                    if (!event.station_ids.includes(HOT_SPORTS_STATION_ID)) {
                        event.station_ids.push(HOT_SPORTS_STATION_ID);
                        console.log(`--> Coincidencia encontrada: Asignando Hot Sports al partido "${event.strEvent}" basado en el título de YouTube: "${stream.snippet.title}"`);
                        break; // Partido asignado, pasar al siguiente stream de YouTube
                    }
                }
            }
        });
    }
    catch (error) {
        console.error("!!! ERROR en el scraper de YouTube para Hot Sports:", error.message);
    }
    return events;
}


// ==========================================================================================
// --- FUNCIÓN PRINCIPAL ---
// ==========================================================================================

async function fetchAndCacheAgenda() {
    if (!THESPORTSDB_API_KEY || !YOUTUBE_API_KEY) {
        console.error("!!! ERROR FATAL: Las claves de API no están configuradas.");
        return;
    }
    console.log("Iniciando la obtención de la agenda completa...");
    // --- FASE 1: OBTENER TODOS LOS EVENTOS (API Y MANUALES) ---
    console.log("\n--- Fase 1: Recopilando todos los eventos nuevos de las APIs y archivos locales ---");
    let radiosData;
    try {
        radiosData = JSON.parse(fs.readFileSync(MANUAL_RADIOS_PATH, 'utf-8'));
    }
    catch (error) {
        console.error("!!! ERROR FATAL: No se pudo leer 'radios.json'.", error.message);
        return;
    }
    
    let manualEvents = [];
    try {
        if (fs.existsSync(MANUAL_EVENTS_PATH)) {
            manualEvents = JSON.parse(fs.readFileSync(MANUAL_EVENTS_PATH, 'utf-8'));
            console.log(`Se cargaron ${manualEvents.length} eventos desde eventos.json.`);
            
            manualEvents.forEach(event => {
                if (event.inline_radios && Array.isArray(event.inline_radios)) {
                    radiosData.push(...event.inline_radios);
                    console.log(`Inyectadas ${event.inline_radios.length} radios "inline" del evento "${event.strEvent}"`);
                }
            });
        }
    }
    catch (error) {
        console.error("Error al cargar o procesar eventos.json:", error.message);
    }

    const newlyFetchedEvents = [];
    const mlbGames = await fetchMlbGames();
    newlyFetchedEvents.push(...mlbGames);
    const teamsToFetch = new Set();
    radiosData.forEach(radio => {
        const ids = Array.isArray(radio.id_thesportsdb) ? radio.id_thesportsdb : [radio.id_thesportsdb];
        ids.forEach(teamId => {
            if (teamId && !MLB_TEAM_IDS_THESPORTSDB.has(String(teamId)) && String(teamId) !== F1_TEAM_ID_FOR_SCHEDULE) {
                teamsToFetch.add(String(teamId));
            }
        });
    });
    const teamsArray = Array.from(teamsToFetch).map(id => ({ id }));
    console.log(`Se buscarán los partidos de ${teamsArray.length} equipos (no MLB, no F1) en TheSportsDB.`);
    for (const [index, team] of teamsArray.entries()) {
        console.log(`(${index + 1}/${teamsArray.length}) Buscando para el equipo ID: ${team.id}`);
        const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventsnext.php?id=${team.id}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data && Array.isArray(data.events)) {
                const nonF1Events = data.events.filter(event => String(event.idLeague) !== FORMULA1_LEAGUE_ID);
                newlyFetchedEvents.push(...nonF1Events);
            }
        }
        catch (error) {
            console.error(`Error de red para el equipo ${team.id}:`, error.message);
        }
        await sleep(2100);
    }
    try {
        console.log("Buscando próximos eventos de Fórmula 1 (búsqueda dedicada)...");
        const f1Url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventsnext.php?id=${F1_TEAM_ID_FOR_SCHEDULE}`;
        const response = await fetch(f1Url);
        const data = await response.json();
        if (data && Array.isArray(data.events)) {
            const f1Races = data.events.filter(event => event.strEvent && event.strEvent.toLowerCase().includes('grand prix')).map(raceEvent => {
                raceEvent.strEvent = F1_GRAND_PRIX_MAP[raceEvent.strEvent] || raceEvent.strEvent;
                return raceEvent;
            });
        if (f1Races.length > 0) {
            newlyFetchedEvents.push(...f1Races);
            console.log(`Se añadieron ${f1Races.length} carreras de Fórmula 1 (Grand Prix) al listado.`);
        }
        else {
            console.log("No se encontró ninguna carrera de F1 (Grand Prix) en los próximos eventos.");
        }
        }
    }
    catch (error) {
        console.error("Error de red al buscar eventos de Fórmula 1:", error.message);
    }
    const newUniqueEvents = Array.from(new Map(newlyFetchedEvents.map(e => [e.idEvent, e])).values());
    console.log(`\nSe encontraron ${newUniqueEvents.length} eventos únicos en la nueva búsqueda.`);

    // --- FASE 2: Fusión inteligente con la caché y eventos manuales ---
    console.log("\n--- Fase 2: Fusión inteligente de datos ---");
    let oldEventsCache = [];
    try {
        if (fs.existsSync(OUTPUT_FILE_PATH)) oldEventsCache = JSON.parse(fs.readFileSync(OUTPUT_FILE_PATH, 'utf-8'));
    }
    catch (error) {
        oldEventsCache = [];
    }
    const updatedTeamIds = new Set();
    newUniqueEvents.forEach(event => {
        if (event.idLeague !== "4424") {
            if (event.idHomeTeam) updatedTeamIds.add(String(event.idHomeTeam));
            if (event.idAwayTeam) updatedTeamIds.add(String(event.idAwayTeam));
        }
    });
    console.log(`Se ha obtenido información fresca para ${updatedTeamIds.size} equipos de TheSportsDB.`);
    const finalEventsMap = new Map();
    newUniqueEvents.forEach(event => finalEventsMap.set(event.idEvent, event));
    let rescuedCount = 0;
    oldEventsCache.forEach(oldEvent => {
        if (finalEventsMap.has(oldEvent.idEvent)) return;
        if (String(oldEvent.idLeague) === FORMULA1_LEAGUE_ID) return;
        if (updatedTeamIds.has(String(oldEvent.idHomeTeam)) || updatedTeamIds.has(String(oldEvent.idAwayTeam))) return;
        if (oldEvent.manual) return;
        /* No rescatar eventos manuales de la caché vieja */
        finalEventsMap.set(oldEvent.idEvent, oldEvent);
        rescuedCount++;
    });
    if (rescuedCount > 0) console.log(`Se rescataron ${rescuedCount} eventos válidos (en curso, etc.) de la caché anterior.`);
    
    manualEvents.forEach(event => finalEventsMap.set(event.idEvent, event));
    
    let allUniqueEvents = Array.from(finalEventsMap.values());
    console.log(`Total de eventos después de la fusión: ${allUniqueEvents.length}.`);

    // --- FASE 3: Enriquecimiento de la agenda ---
    console.log("\n--- Fase 3: Enriqueciendo la agenda... ---");
    allUniqueEvents.forEach(event => { 
        event.station_ids = new Set(Array.isArray(event.station_ids) ? event.station_ids : []);
        if (event.manual_station_ids && Array.isArray(event.manual_station_ids)) {
            event.manual_station_ids.forEach(id => event.station_ids.add(id));
        }
        const homeId = String(event.idHomeTeam);
        const awayId = String(event.idAwayTeam);
        const leagueId = String(event.idLeague); 
        radiosData.forEach(station => {
            const stationIds = (Array.isArray(station.id_thesportsdb) ? station.id_thesportsdb : [station.id_thesportsdb]).map(String);
            if (stationIds.includes(homeId) || stationIds.includes(awayId) || stationIds.includes(leagueId)) {
                event.station_ids.add(station.id);
            }
        }); 
        event.station_ids = Array.from(event.station_ids); 
    });

    // --- FASE 4: Limpieza y lógica de asignación ---
    const now = new Date();
    let finalEvents = allUniqueEvents.filter(event => {
        if (event.strTimestamp) {
            const duration = getEventDuration(event.strLeague);
            const endTime = new Date(new Date(event.strTimestamp).getTime() + duration);
            if (endTime < now && (event.strStatus === 'Match Finished' || event.strStatus === 'F')) return false;
        }
        return true;
    });
    finalEvents.forEach(event => {
        if (String(event.idLeague) === '4424') {
            if (!Array.isArray(event.station_ids)) {
                event.station_ids = [];
            }
            if (!event.station_ids.includes(SUPER7_STATION_ID)) {
                event.station_ids.push(SUPER7_STATION_ID);
            }
        }
    });
    console.log("Asignación forzada de Super 7 FM a todos los eventos de la MLB completada.");

    // --- FASE 5: Asignación TUDN, Scrapers y Eventos Virtuales ---
    console.log("\n--- Fase 5: Lógica avanzada de asignación y eventos virtuales ---");

    // --- CORREGIDO: Lógica de la Red TUDN con asignación dual ---
    const conflictWindow = 4 * 60 * 60 * 1000;
    finalEvents.forEach(event => {
        // Solo aplica para la MLB
        if (String(event.idLeague) === '4424') {
            
            // Intenta asignar UNA radio de la cola de TUDN a CADA partido de MLB
            for (const tudnStationId of TUDN_NETWORK_STATIONS) {
                // Condición 1: ¿Esta radio específica ya está en el partido? Si es así, no la añadimos de nuevo.
                // Esto evita duplicados y permite que WRTO (local) coexista con otra de la red (nacional).
                if (event.station_ids.includes(tudnStationId)) {
                    continue; // Ya la tiene, probamos la siguiente de la cola.
                }
                // Condición 2: ¿Esta radio está ocupada por otro partido en un horario conflictivo?
                let isBusy = false;
                for (const otherEvent of finalEvents) {
                    if (otherEvent.idEvent !== event.idEvent &&
                        otherEvent.station_ids.includes(tudnStationId) &&
                        Math.abs(new Date(event.strTimestamp) - new Date(otherEvent.strTimestamp)) < conflictWindow) {
                        isBusy = true;
                        break;
                    }
                }
                // Si no está ocupada, la asignamos y TERMINAMOS de buscar para ESTE partido.
                if (!isBusy) {
                    event.station_ids.push(tudnStationId);
                    console.log(`Asignando TUDN de respaldo "${tudnStationId}" al partido "${event.strEvent}"`);
                    break; // ¡Importante! Evita que se asignen MÚLTIPLES radios de respaldo al mismo partido.
                }
            }
        }
    });

    finalEvents = await fetchAndAssignYoutubeStreams(finalEvents);
    
    const virtualEvents = [];
    const todayString = now.toISOString().split('T')[0];
    const hayChampionsHoy = finalEvents.some(e => e.idLeague === CHAMPIONS_LEAGUE_ID && e.dateEvent === todayString);
    if (hayChampionsHoy) {
        const argTime = new Date();
        argTime.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        argTime.setUTCHours(19, 0, 0, 0);
        virtualEvents.push({ idEvent: "virtual-2", strEvent: "Champions League en español", strLeague: "UEFA Champions League", strHomeTeam: "Champions League en español", strAwayTeam: "", strTimestamp: argTime.toISOString(), station_ids: CHAMPIONS_LEAGUE_STATION_IDS, idLeague: CHAMPIONS_LEAGUE_ID });
        console.log("Evento virtual de Champions League creado porque hay partidos hoy."); }
        else {
            console.log("No se crea evento virtual de Champions League porque no hay partidos hoy.");
        }

    try {
        const cubanGamesToday = finalEvents.filter(e => String(e.idLeague) === CUBAN_LEAGUE_ID && e.dateEvent === todayString);
        if (cubanGamesToday.length >= 3) {
            const gameTimes = {};
            cubanGamesToday.forEach(game => {
                if(game.strTimestamp) {
                    const time = game.strTimestamp;
                    gameTimes[time] = (gameTimes[time] || 0) + 1;
                }
            });
            let broadcastTime = null;
            const sortedTimes = Object.keys(gameTimes).sort();
            for (const time of sortedTimes) {
                if (gameTimes[time] >= 3) {
                    broadcastTime = time;
                    break;
                }
            }
            if (broadcastTime) {
                virtualEvents.push({
                    idEvent: "virtual-3", strEvent: "Béisbol Rebelde", strLeague: "Serie Nacional Cubana",
                    strHomeTeam: "Béisbol Rebelde", strAwayTeam: "", strTimestamp: broadcastTime,
                    station_ids: [RADIO_REBELDE_STATION_ID],
                    idLeague: CUBAN_LEAGUE_ID,
                });
                console.log(`Evento virtual 'Béisbol Rebelde' creado a las ${new Date(broadcastTime).toUTCString()} (UTC) al haber ${gameTimes[broadcastTime]} partidos simultáneos.`);
            }
            else {
                console.log("No se crea evento virtual 'Béisbol Rebelde': no hay 3 o más partidos simultáneos hoy.");
            }
        }
        else {
            console.log("No se crea evento virtual 'Béisbol Rebelde': no hay suficientes partidos de la liga cubana hoy.");
        }
    }
    catch(err) {
        console.warn("Error evaluando Béisbol Rebelde:", err);
    }
    
    let finalAgenda = [...finalEvents, ...virtualEvents].filter(event => event.station_ids && event.station_ids.length > 0);
    console.log(`Agenda final generada con ${finalAgenda.length} eventos con transmisión confirmada.`);
    try {
        fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(finalAgenda, null, 2));
        console.log(`\n¡Éxito! Agenda guardada en ${OUTPUT_FILE_PATH}`);
        try {
            await redisClient.del('agenda_cache');
            console.log('🧹 Caché de Redis ("agenda_cache") vaciada exitosamente.');
        }
        catch (err) {
            console.warn('⚠️ No se pudo limpiar la caché de Redis:', err.message);
        }
    }
    catch (error) {
        console.error("Error al guardar el archivo de agenda:", error);
    }
    try {
        if (redisClient && typeof redisClient.quit === 'function') {
            await redisClient.quit();
            console.log('🔒 Conexión Redis cerrada correctamente.');
        }
    }
    catch (err) {
        console.warn('⚠️ Error al cerrar Redis:', err.message);
    }
    finally{
        console.log('✅ Proceso completado. Cerrando ejecución...');
        process.exit(0);
    }
}

fetchAndCacheAgenda();