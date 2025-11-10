import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import fetchAndCacheAgenda from './agenda.js';

const logPath = path.resolve(process.cwd(), 'agenda.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
}

function updateAgenda(){
    cron.schedule('45 * * * *', async () => {
        logToFile('=== Iniciando actualización de agenda ===');
        try {
            await fetchAndCacheAgenda();
            logToFile('✅ Agenda actualizada correctamente.');
        }
        catch (error) {
            logToFile(`❌ Error al actualizar agenda: ${error.message}`);
        }
        logToFile('=== Fin de ejecución ===\n');
    });
    logToFile('Tarea programada: se ejecutará al minuto 45 de cada hora.');
}

export default updateAgenda;