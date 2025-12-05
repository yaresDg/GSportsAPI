import fetch from 'node-fetch';
import { google } from 'googleapis';
import redisClient from './redisClient.js';
import mongoose from 'mongoose';
import connectDb from './db/connection.js';
import agendaEventModel from './model/agendaEventModel.js';
import ManualEvent from './model/manualEventModel.js';
import Radio from './model/radioModel.js';
import * as cheerio from 'cheerio';
import { DateTime } from 'luxon';
import { URLSearchParams } from 'url';
import {AbortController} from 'abort-controller';
import dotenv from 'dotenv';

dotenv.config();
await connectDb();

const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const HOT_SPORTS_YOUTUBE_CHANNEL_ID = "UC4tBHwQc6J2jlXKvL2kpWgQ";
const HOT_SPORTS_STATION_ID = 'hot_sports';

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
//nuevasIDS
const UNION_RADIO_ID = 'union_radio_ve';
const XERED_ID = 'xered_radio_red_texans';
const LMP_LEAGUE_ID = '132';
const LVBP_LEAGUE_ID = '135';
const GODEANO_PRESENTS_ID = 'godeano_presents';
// Ligas para MLB Stats API
const LEAGUES_TO_FETCH = [
    { id: '132', name: 'Liga Mexicana del Pacífico' },
    { id: '131', name: 'LIDOM' },
    { id: '135', name: 'LVBP' },
    { id: '133', name: 'Liga de Béisbol de Puerto Rico' },
    { id: '1', name: 'MLB' }
];
// TV Sources
const TV_SOURCES = [
    { 
        name: 'ESPN Deportes', 
        id: 'espn_deportes', 
        url: 'https://www.tvpassport.com/tv-listings/stations/espn-deportes/2108'
    },
    { 
        name: 'Telemundo East', 
        id: 'telemundo_east', 
        url: 'https://www.tvpassport.com/tv-listings/stations/telemundo-east-hd/33284'
    }
];
const TV_FORCE_TIMEZONE_ID = 'America/New_York';

//DICCIONARIOS Y AYUDANTES
const F1_GRAND_PRIX_MAP = { "Bahrain Grand Prix": "Gran Premio de Baréin", "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudita", "Australian Grand Prix": "Gran Premio de Australia", "Japanese Grand Prix": "Gran Premio de Japón", "Chinese Grand Prix": "Gran Premio de China", "Miami Grand Prix": "Gran Premio de Miami", "Emilia Romagna Grand Prix": "Gran Premio de Emilia-Romaña", "Monaco Grand Prix": "Gran Premio de Mónaco", "Canadian Grand Prix": "Gran Premio de Canadá", "Spanish Grand Prix": "Gran Premio de España", "Austrian Grand Prix": "Gran Premio de Austria", "British Grand Prix": "Gran Premio de Gran Bretaña", "Hungarian Grand Prix": "Gran Premio de Hungría", "Belgian Grand Prix": "Gran Premio de Bélgica", "Dutch Grand Prix": "Gran Premio de los Países Bajos", "Italian Grand Prix": "Gran Premio de Italia", "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán", "Singapore Grand Prix": "Gran Premio de Singapur", "United States Grand Prix": "Gran Premio de los Estados Unidos", "Mexico City Grand Prix": "Gran Premio de la Ciudad de México", "Sao Paulo Grand Prix": "Gran Premio de São Paulo", "Las Vegas Grand Prix": "Gran Premio de Las Vegas", "Qatar Grand Prix": "Gran Premio de Qatar", "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi" };

function getEventDuration(sport){
    const sportType = sport || "";
    if (sportType.includes('Soccer') || sportType.includes('Champions')) return 2.5 * 60 * 60 * 1000;
    if (sportType.includes('Basketball')) return 3 * 60 * 60 * 1000;
    if (sportType.includes('Baseball') || sportType.includes('MLB') || sportType.includes('Pacífico') || sportType.includes('Venezolana') || sportType.includes('LIDOM')) return 3.5 * 60 * 60 * 1000;
    return 4 * 60 * 60 * 1000;
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function normalizeText(text){
    if (!text) return '';
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/vs\.?|@|en vivo|directo|\./g, '')
        .trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

async function fetchWinterLeaguesAndMlb() {
    console.log("Buscando partidos MLB y Ligas de Invierno (API Stats)...");
    const dates = [ new Date().toISOString().split('T')[0] ];
    const tmrw = new Date(); 
    tmrw.setDate(tmrw.getDate()+1);
    dates.push(tmrw.toISOString().split('T')[0]);

    const events = [];

    for (const dateStr of dates) {
        for (const league of LEAGUES_TO_FETCH) {
            const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1,17&leagueId=${league.id}&date=${dateStr}&hydrate=team`;
            try {
                const response = await fetchWithTimeout(url);
                const data = await response.json();
                
                if (data.dates && data.dates.length > 0) {
                    const games = data.dates[0].games;
                    games.forEach(game => {
                        const homeId = String(game.teams.home.team.id);
                        const awayId = String(game.teams.away.team.id);
                        const leagueId = String(league.id);

                        events.push({
                            idEvent: String(game.gamePk),
                            strEvent: `${game.teams.home.team.name} vs ${game.teams.away.team.name}`,
                            idLeague: leagueId,
                            strLeague: league.name,
                            strHomeTeam: game.teams.home.team.name,
                            strAwayTeam: game.teams.away.team.name,
                            idHomeTeam: homeId,
                            idAwayTeam: awayId,
                            idHomeTeamTSDB: MLB_ID_TO_THESPORTSDB_ID_MAP[homeId] || null,
                            idAwayTeamTSDB: MLB_ID_TO_THESPORTSDB_ID_MAP[awayId] || null,
                            strTimestamp: new Date(game.gameDate).toISOString(),
                            dateEvent: game.officialDate,
                            strStatus: game.status.abstractGameState,
                            station_ids: []
                        });
                    });
                }
            } catch (error) { 
                console.log(`Error fetch liga ${league.name} (${dateStr}): ${error.message}`); 
            }
        }
    }
    console.log(`Se encontraron ${events.length} partidos de béisbol.`);
    return events;
}

async function scrapeUnionRadioMatches() {
    console.log("Iniciando Scraper El Emergente (LVBP)...");
    const EL_EMERGENTE_URL = 'https://elemergente.com/tag/breves-de-la-lvbp';
    let matchesFound = [];

    try {
        const resList = await fetchWithTimeout(EL_EMERGENTE_URL, { 
            headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        const htmlList = await resList.text();
        const $list = cheerio.load(htmlList);
        
        let articleUrl = null;
        $list('article h2 a, .entry-title a, h3 a').each((i, el) => {
            if (articleUrl) return;
            const title = normalizeText($list(el).text());
            const href = $list(el).attr('href');
            if (title.includes('asi va la lvbp') || 
                (title.includes('juegos') && title.includes('tv'))) {
                articleUrl = href;
                console.log(`   -> Artículo LVBP detectado: ${title}`);
            }
        });

        if (!articleUrl) return [];

        const resArt = await fetchWithTimeout(articleUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        const htmlArt = await resArt.text();
        const $ = cheerio.load(htmlArt);

        const teamKeywords = {
            'aguilas': 'aguilas', 'zulia': 'aguilas',
            'bravos': 'bravos', 'margarita': 'bravos',
            'cardenales': 'cardenales', 'lara': 'cardenales',
            'caribes': 'caribes', 'anzoategui': 'caribes',
            'leones': 'leones', 'caracas': 'leones',
            'navegantes': 'navegantes', 'magallanes': 'navegantes',
            'tiburones': 'tiburones', 'guaira': 'tiburones',
            'tigres': 'tigres', 'aragua': 'tigres'
        };

        $('p, li').each((i, el) => {
            const text = $(el).text();
            const normText = normalizeText(text);

            if (normText.includes('union radio') || 
                normText.includes('circuito radial') || 
                (normText.includes('transmi') && normText.includes('radio'))) {
                const detectedTeams = new Set();
                Object.keys(teamKeywords).forEach(key => {
                    if (normText.includes(key)) detectedTeams.add(teamKeywords[key]);
                });

                if (detectedTeams.size >= 2) {
                    matchesFound.push(Array.from(detectedTeams));
                    console.log(`   -> Unión Radio Match: ${Array.from(detectedTeams).join(' vs ')}`);
                }
            }
        });
    } catch (e) { 
        console.log(`Error Scraper LVBP: ${e.message}`); 
    }
    return matchesFound;
}

function applyUnionRadioMatches(allEvents, matches) {
    if (matches.length === 0) return;
    allEvents.forEach(event => {
        if (String(event.idLeague) !== LVBP_LEAGUE_ID) return;
        
        const normHome = normalizeText(event.strHomeTeam);
        const normAway = normalizeText(event.strAwayTeam);
        
        matches.forEach(matchTeams => {
            const t1 = matchTeams[0];
            const t2 = matchTeams[1];
            if ((normHome.includes(t1) || normAway.includes(t1)) && 
                (normHome.includes(t2) || normAway.includes(t2))) {
                if (!Array.isArray(event.station_ids)) event.station_ids = [];
                if (!event.station_ids.includes(UNION_RADIO_ID)) {
                    event.station_ids.push(UNION_RADIO_ID);
                    console.log(`   -> Asignado Unión Radio a: ${event.strEvent}`);
                }
            }
        });
    });
}

async function initializeTvSession() {
    const params = new URLSearchParams();
    params.append('timezone', TV_FORCE_TIMEZONE_ID);
    try {
        const response = await fetch("https://www.tvpassport.com/my-passport/dashboard/save_timezone", {
            method: 'POST', 
            body: params, 
            redirect: 'manual',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'User-Agent': 'Mozilla/5.0' 
            }
        });
        const rawCookies = response.headers.raw()['set-cookie'];
        if (!rawCookies) throw new Error("No cookies");
        return rawCookies.map(c => c.split(';')[0]).join('; ');
    } catch (e) { 
        console.log("Error sesión TV:", e.message); 
        return null; 
    }
}

function isSportsEvent(title, description, showType) {
    const text = (title + " " + description).toLowerCase();
    const blacklist = [
        'resumen', 'noticiero', 'sportscenter', 'fútbol picante', 
        'ahora o nunca', 'titulares', 'cronómetro', 'repetición', 
        'lo mejor de', 'highlight', 'show', 'telenovela', 'película', 
        'serie', 'capítulo', 'episodio', 'carrusel', 'morning', 
        'exatlón', 'acércate', 'noticias', 'hoy día', 
        'rosa de guadalupe', 'paid programming', 'generación f', 
        'es así y punto'
    ];
    if (blacklist.some(w => text.includes(w))) return false;
    if (showType && (showType.includes('News') || showType.includes('Talk Show'))) return false;
    if (text.includes(' vs ') || text.includes(' vs. ') || text.includes(' @ ')) return true;
    const keywords = [
        'gran premio', 'formula 1', 'prix', 'nascar', 'indycar', 
        'motogp', 'ufc ', 'boxeo', 'partido', 'juego', 'en vivo', 'live'
    ];
    return keywords.some(w => text.includes(w));
}

async function fetchTvPassportData() {
    console.log("Iniciando Scraper TV Passport...");
    const sessionCookie = await initializeTvSession();
    if (!sessionCookie) return [];

    let allTvEvents = [];
    for (const station of TV_SOURCES) {
        try {
            const response = await fetchWithTimeout(station.url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0', 
                    'Cookie': sessionCookie 
                }
            });
            const html = await response.text();
            const $ = cheerio.load(html);
            const stationEventsMap = new Map();

            $('.list-group-item').each((i, el) => {
                const rawTime = $(el).attr('data-st');
                const showName = $(el).attr('data-showname') || "";
                const episodeTitle = $(el).attr('data-episodetitle') || "";
                const description = $(el).attr('data-description') || "";
                const showType = $(el).attr('data-showtype') || "";
                const isLive = $(el).attr('data-live') === '1';
                const team1 = $(el).attr('data-team1');
                const team2 = $(el).attr('data-team2');

                if (!rawTime) return;

                let strEvent = `${showName} ${episodeTitle}`.trim();
                let homeTeam = team1 || '';
                let awayTeam = team2 || '';
                let isValid = false;

                if (homeTeam && awayTeam) {
                    strEvent = `${homeTeam} vs ${awayTeam}`;
                    isValid = true;
                } else {
                    const match = strEvent.match(/([A-Za-z0-9\s\.\-]+)\s(?:vs\.|vs|@)\s([A-Za-z0-9\s\.\-]+)/i);
                    if (match && match.length >= 3) {
                        homeTeam = match[1].replace(/Fútbol LaLiga|En Vivo|Live|Fútbol/gi, '').trim();
                        awayTeam = match[2].split('.')[0].trim();
                        strEvent = `${homeTeam} vs ${awayTeam}`;
                        isValid = true;
                    }
                }

                if (!isValid) {
                    if (!isSportsEvent(strEvent, description, showType)) return;
                } else {
                    if (!isSportsEvent(strEvent, description, showType)) return;
                }

                let eventDate = DateTime.fromSQL(rawTime, { zone: TV_FORCE_TIMEZONE_ID });
                if (!eventDate.isValid) return;

                const eventKey = strEvent.toLowerCase().trim();
                const newEv = {
                    idEvent: `tv-${station.id}-${eventDate.toMillis()}`,
                    strEvent: strEvent,
                    strLeague: showName.replace('En Vivo', '').trim(),
                    idLeague: "TV_DATA",
                    strHomeTeam: homeTeam || strEvent,
                    strAwayTeam: awayTeam,
                    strTimestamp: eventDate.toUTC().toISO(),
                    station_ids: [station.id],
                    strStatus: "TV",
                    _isLive: isLive,
                    _rawTime: eventDate.toMillis()
                };

                if (stationEventsMap.has(eventKey)) {
                    const ex = stationEventsMap.get(eventKey);
                    if (newEv._isLive && !ex._isLive) stationEventsMap.set(eventKey, newEv);
                    else if (newEv._isLive === ex._isLive && newEv._rawTime < ex._rawTime) 
                        stationEventsMap.set(eventKey, newEv);
                } else {
                    stationEventsMap.set(eventKey, newEv);
                }
            });

            for (const ev of stationEventsMap.values()) {
                delete ev._isLive;
                delete ev._rawTime;
                allTvEvents.push(ev);
            }
        } catch (e) { 
            console.log(`Error TV ${station.name}: ${e.message}`); 
        }
    }
    console.log(`TV Scraper: ${allTvEvents.length} eventos encontrados.`);
    return allTvEvents;
}

function mergeTvEvents(apiEvents, tvEvents) {
    const merged = [...apiEvents];
    let matched = 0, added = 0;

    tvEvents.forEach(tvEv => {
        const match = merged.find(apiEv => {
            const timeDiff = Math.abs(new Date(apiEv.strTimestamp) - new Date(tvEv.strTimestamp));
            if (timeDiff > (4 * 3600 * 1000)) return false;

            const normTv = normalizeText(tvEv.strEvent);
            const normApi = normalizeText(apiEv.strEvent);
            const home = normalizeText(apiEv.strHomeTeam);
            const away = normalizeText(apiEv.strAwayTeam);

            return (normTv.includes(home) || home.includes(normTv)) && 
                   (normTv.includes(away) || away.includes(normTv));
        });

        if (match) {
            if (!Array.isArray(match.station_ids)) match.station_ids = [];
            const sid = tvEv.station_ids[0];
            if (!match.station_ids.includes(sid)) {
                match.station_ids.push(sid);
                matched++;
            }
        } else {
            if (tvEv.strEvent.includes('vs')) {
                merged.push(tvEv);
                added++;
            }
        }
    });
    console.log(`Fusión TV: ${matched} enriquecidos, ${added} nuevos agregados.`);
    return merged;
}

//SCRAPER DE YOUTUBE (VERSIÓN MEJORADA)
/*async function fetchAndAssignYoutubeStreams(events) {
    console.log("\n--- Iniciando Scraper de YouTube para Hot Sports ---");
    if (!YOUTUBE_API_KEY) {
        console.log("ADVERTENCIA: No se proporcionó YOUTUBE_API_KEY. Saltando scraper de YouTube.");
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
        const getMlbShortName = (fullTeamName) => {
            if (!fullTeamName) return null;
            const normalized = normalizeText(fullTeamName);
            if (normalized.includes("blue jays")) return "blue jays";
            if (normalized.includes("red sox")) return "red sox";
            if (normalized.includes("white sox")) return "white sox";
            return normalized.split(' ').pop();
        };
        upcomingStreams.forEach(stream => {
            const normalizedTitle = normalizeText(stream.snippet.title);
            for (const event of events) {
                if (String(event.idLeague) !== '4424') continue;
                const homeShortName = getMlbShortName(event.strHomeTeam);
                const awayShortName = getMlbShortName(event.strAwayTeam);
                if (homeShortName && awayShortName && normalizedTitle.includes(homeShortName) && normalizedTitle.includes(awayShortName)) {
                    if (!Array.isArray(event.station_ids)) {
                        event.station_ids = [];
                    }
                    if (!event.station_ids.includes(HOT_SPORTS_STATION_ID)) {
                        event.station_ids.push(HOT_SPORTS_STATION_ID);
                        console.log(`--> Coincidencia encontrada: Asignando Hot Sports al partido "${event.strEvent}" basado en el título de YouTube: "${stream.snippet.title}"`);
                        break;
                    }
                }
            }
        });
    }
    catch (error) {
        console.log("!!! ERROR en el scraper de YouTube para Hot Sports:", error.message);
    }
    return events;
}*/

async function deleteKeysByPattern(pattern) {
    let cursor = '0';
    let totalDeleted = 0;
    do {
        const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
            MATCH: pattern,
            COUNT: 100
        });
        cursor = nextCursor;
        if (keys.length > 0) {
            await redisClient.del(keys);
            totalDeleted += keys.length;
        }
    }
    while (cursor !== '0');
    console.log(`Se eliminaron ${totalDeleted} claves que coinciden con "${pattern}"`);
}

//FUNCIÓN PRINCIPAL
async function fetchAndCacheAgenda() {
    if (!THESPORTSDB_API_KEY || !YOUTUBE_API_KEY) {
        console.log("!!! ERROR FATAL: Las claves de API no están configuradas.");
        return;
    }
    const startTimeOperation=Date.now();
    console.log("Iniciando la obtención de la agenda completa...");
    //FASE 1: OBTENER TODOS LOS EVENTOS (API Y MANUALES)
    console.log("\n--- Fase 1: Recopilando todos los eventos nuevos de las APIs y archivos locales ---");
    let radiosData;
    try {
        radiosData = await Radio.find({}).lean();
        console.log(`Se cargaron ${radiosData.length} radios desde la base de datos`)
    }
    catch (error) {
        console.log(`Error: no se pudieron cargar las radios de la base de datos: ${error.message}`);
        return;
    }
    
    let manualEvents = [];
    try {
        manualEvents = await ManualEvent.find({}).lean();
        console.log(`Se cargaron ${manualEvents.length} eventos desde la base de datos`);
        
        manualEvents.forEach(event => {
            if (Array.isArray(event.station_ids)) {
                event.station_ids.forEach(station => {
                    if (typeof station === 'object' && station !== null && station.id) {
                        if (!radiosData.some(r => r.id === station.id)) {
                            radiosData.push(station);
                            console.log(`Inyectada radio "inline" (${station.id}) del evento "${event.strEvent}"`);
                        }
                    }
                });
            }
            if (event.inline_radios && Array.isArray(event.inline_radios)) {
                radiosData.push(...event.inline_radios);
                console.log(`Inyectadas ${event.inline_radios.length} radios "inline" del evento "${event.strEvent}"`);
            }
        });
    }
    catch (error) {
        console.log(`Error al cargar los eventos de la base de datos: ${error.message}`);
    }

    const newlyFetchedEvents = [];
    newlyFetchedEvents.push(...await fetchWinterLeaguesAndMlb());
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
            console.log(`Error de red para el equipo ${team.id}: ${error.message}`);
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
        console.log(`Error de red al buscar eventos de Fórmula 1: ${error.message}`);
    }
    const newUniqueEvents = Array.from(new Map(newlyFetchedEvents.map(e => [e.idEvent, e])).values());
    console.log(`\nSe encontraron ${newUniqueEvents.length} eventos únicos en la nueva búsqueda.`);
    console.log("\n--- Fase 2: Fusión inteligente de datos ---");
    let oldEventsCache = [];
    try {
        oldEventsCache = await agendaEventModel.find({}).lean();
        console.log(`Se cargaron ${oldEventsCache.length} eventos antiguos desde MongoDB.`);
    }
    catch (err) {
        console.log(`⚠️ No se pudieron cargar eventos previos desde MongoDB: ${err.message}`);
    }
    const updatedTeamIds = new Set();
    const BASEBALL_LEAGUE_IDS = new Set(['4424', '1', '131', '132', '133', '135']); // TSDB MLB + StatsAPI + Invierno
    newUniqueEvents.forEach(event => {
        if (!BASEBALL_LEAGUE_IDS.has(String(event.idLeague))) {
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
        finalEventsMap.set(oldEvent.idEvent, oldEvent);
        rescuedCount++;
    });
    if (rescuedCount > 0) console.log(`Se rescataron ${rescuedCount} eventos válidos (en curso, etc.) de la caché anterior.`);
    manualEvents.forEach(event => {
        if (!finalEventsMap.has(event.idEvent)){
            event.manual=true;
            finalEventsMap.set(event.idEvent, event);
        }
    });
    let allUniqueEvents = Array.from(finalEventsMap.values());
    console.log(`Total de eventos después de la fusión: ${allUniqueEvents.length}.`);
    console.log("\n--- Fase 3: Enriqueciendo la agenda... ---");
    allUniqueEvents.forEach(event => {
        const existingStations = new Set(Array.isArray(event.station_ids) ? event.station_ids.map(s => typeof s === 'object' ? s.id : s) : []);
        if (event.manual_station_ids && Array.isArray(event.manual_station_ids)) {
            event.manual_station_ids.forEach(id => existingStations.add(id));
        }
        const homeId = String(event.idHomeTeam);
        const awayId = String(event.idAwayTeam);
        const leagueId = String(event.idLeague);
        const homeIdTSDB = event.idHomeTeamTSDB; 
        const awayIdTSDB = event.idAwayTeamTSDB;
        radiosData.forEach(station => {
            const stationIds = (Array.isArray(station.id_thesportsdb) ? station.id_thesportsdb : [station.id_thesportsdb]).map(String);
            if (stationIds.includes(homeId) || stationIds.includes(awayId) || stationIds.includes(leagueId) ||     (homeIdTSDB && stationIds.includes(homeIdTSDB)) || (awayIdTSDB && stationIds.includes(awayIdTSDB))) {
                const isLidom = (leagueId === '131');
                if (isLidom && stationIds.includes(awayId) && !stationIds.includes(homeId)) return;
                if (!existingStations.has(station.id)) {
                    if (!Array.isArray(event.station_ids)) event.station_ids = [];
                    event.station_ids.push(station.id);
                    existingStations.add(station.id);
                }
            }
        });
    });
    console.log("\n--- Fase 3.5: Enriquecimiento con Scrapers ---");
    // A) EL EMERGENTE (LVBP)
    const unionRadioMatches = await scrapeUnionRadioMatches();
    applyUnionRadioMatches(allUniqueEvents, unionRadioMatches);
    // B) TV PASSPORT
    const tvEvents = await fetchTvPassportData();
    allUniqueEvents = mergeTvEvents(allUniqueEvents, tvEvents);
    console.log("\n--- Fase 4: Limpieza y lógica de asignación ---");
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
        if (String(event.idLeague) === '4424' || String(event.idLeague) === '1') {
            if (!Array.isArray(event.station_ids)) {
                event.station_ids = [];
            }
            if (!event.station_ids.includes(SUPER7_STATION_ID)) {
                event.station_ids.push(SUPER7_STATION_ID);
            }
        }
    });
    console.log("Asignación forzada de Super 7 FM a todos los eventos de la MLB completada.");
    console.log("\n--- Fase 5: Lógica avanzada de asignación y eventos virtuales ---");
    const conflictWindow = 4 * 60 * 60 * 1000;
    finalEvents.forEach(event => {
        if (String(event.idLeague) === '4424' || String(event.idLeague) === '1') {
            const currentStationIds = event.station_ids.map(s => typeof s === 'object' ? s.id : s);
            for (const tudnStationId of TUDN_NETWORK_STATIONS) {
                if (currentStationIds.includes(tudnStationId)) {
                    continue;
                }
                let isBusy = false;
                for (const otherEvent of finalEvents) {
                    const otherStationIds = otherEvent.station_ids.map(s => typeof s === 'object' ? s.id : s);
                    if (otherEvent.idEvent !== event.idEvent &&
                        otherStationIds.includes(tudnStationId) &&
                        Math.abs(new Date(event.strTimestamp) - new Date(otherEvent.strTimestamp)) < conflictWindow) {
                        isBusy = true;
                        break;
                    }
                }
                if (!isBusy) {
                    event.station_ids.push(tudnStationId);
                    console.log(`Asignando TUDN de respaldo "${tudnStationId}" al partido "${event.strEvent}"`);
                    break;
                }
            }
        }
    });
    //finalEvents = await fetchAndAssignYoutubeStreams(finalEvents);
    const virtualEvents = [];
    const todayString = now.toISOString().split('T')[0];
    const hayChampionsHoy = finalEvents.some(e => 
        String(e.idLeague) === CHAMPIONS_LEAGUE_ID && 
        e.dateEvent && 
        e.dateEvent.trim().startsWith(todayString)
    );
    if (hayChampionsHoy) {
        const argTime = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            19, 0, 0, 0
        ));
        const vTime = `${todayString}T19:00:00Z`;
        virtualEvents.push({ 
            idEvent: `virtual-champions-${todayString}`, 
            strEvent: "Champions League en español", 
            strLeague: "Godeano Sports PRESENTA", 
            strTimestamp: vTime, 
            station_ids: CHAMPIONS_LEAGUE_STATION_IDS, 
            idLeague: GODEANO_PRESENTS_ID, 
            strStatus: "VIRTUAL" 
        });
        console.log("Evento virtual de Champions League creado porque hay partidos hoy.");
    } else {
        console.log("No se crea evento virtual de Champions League porque no hay partidos hoy.");
    }

    try {
        const cubanGamesToday = finalEvents.filter(e => String(e.idLeague) === CUBAN_LEAGUE_ID && e.dateEvent && e.dateEvent.trim().startsWith(todayString));
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
                    strHomeTeam: "Béisbol Rebelde", strAwayTeam: "", strTimestamp: new Date(broadcastTime).toISOString(),
                    station_ids: [RADIO_REBELDE_STATION_ID],
                    idLeague: CUBAN_LEAGUE_ID,
                    strStatus: "VIRTUAL"
                });
                console.log(`Evento virtual 'Béisbol Rebelde' creado a las ${new Date(broadcastTime).toUTCString()} (UTC) al haber ${gameTimes[broadcastTime]} partidos simultáneos.`);
            } else {
                console.log("No se crea evento virtual 'Béisbol Rebelde': no hay 3 o más partidos simultáneos hoy.");
            }
        } else {
            console.log("No se crea evento virtual 'Béisbol Rebelde': no hay suficientes partidos de la liga cubana hoy.");
        }
    }
    catch(err) {
        console.log(`Error evaluando Béisbol Rebelde: ${err}`);
    }
    // XERED LMP (Virtual basado en moda horaria)
    const lmpGames = finalEvents.filter(e => 
        String(e.idLeague) === LMP_LEAGUE_ID && 
        e.strTimestamp.startsWith(todayString)
    );
    if (lmpGames.length > 0) {
        const timeCounts = {};
        lmpGames.forEach(g => {
            timeCounts[g.strTimestamp] = (timeCounts[g.strTimestamp] || 0) + 1;
        });
        let bestTime = Object.keys(timeCounts).reduce((a, b) => 
            timeCounts[a] > timeCounts[b] ? a : b
        );
        virtualEvents.push({ 
            idEvent: `virtual-xered-${todayString}`, 
            strEvent: "Liga Mexicana del Pacífico", 
            strLeague: "Godeano Sports PRESENTA", 
            strTimestamp: bestTime, 
            station_ids: [XERED_ID], 
            idLeague: GODEANO_PRESENTS_ID, 
            strStatus: "VIRTUAL" 
        });
        console.log(`Evento virtual 'XERED LMP' creado para ${bestTime}.`);
    }
    let finalAgenda = [...finalEvents, ...virtualEvents].filter(event => event.station_ids && event.station_ids.length > 0);
    console.log(`Agenda final generada con ${finalAgenda.length} eventos con transmisión confirmada.`);
    try {
        await agendaEventModel.deleteMany({});
        console.log('Base de datos limpiada.');
        finalAgenda=finalAgenda.map(ev=>{
            if(ev._id) delete ev._id;
            return ev;
        });
        await agendaEventModel.insertMany(finalAgenda, { ordered: false });
        console.log(`Se guardaron ${finalAgenda.length} eventos en MongoDB.`);
        try {
            await redisClient.del('agenda_cache');
            console.log('Caché de Redis ("agenda_cache") vaciada exitosamente.');
            await deleteKeysByPattern('agenda_event_*');
        }
        catch (err) {
            console.log(`⚠️ No se pudo limpiar la caché de Redis: ${err.message}`);
        }
    }
    catch (error) {
        console.log(`Error al guardar la agenda en MongoDB: ${error.message}`);
    }
    finally{
        try {
            if (redisClient && typeof redisClient.quit === 'function') {
                await redisClient.quit();
                console.log('Conexión Redis cerrada correctamente.');
            }
        } catch (err) {
            console.log(`⚠️ Error al cerrar Redis: ${err.message}`);
        }
        try {
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada correctamente.');
        } catch (err) {
            console.log(`⚠️ Error al cerrar MongoDB: ${err.message}`);
        }
        const endTimeOperation=Date.now();
        const totalMs= endTimeOperation - startTimeOperation;
        const totalSeconds=Math.floor(totalMs / 1000);
        const minutes=Math.floor(totalSeconds / 60);
        const seconds= totalSeconds % 60;
        console.log(`Operación completada en ${minutes} minutos y ${seconds} segundos`);
        console.log('Proceso completado. Cerrando ejecución...');
        process.exit(0);
    }
}

fetchAndCacheAgenda();