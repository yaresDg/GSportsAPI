import { Router } from "express";
import indexController from "../Controller/indexController.js";
import agendaController from "../Controller/agendaController.js";
import radioController from "../Controller/radioController.js";
import eventController from "../Controller/eventController.js";
import updateController from "../Controller/updateController.js";

const router=Router();

//agendaController
router.get('/agenda', agendaController.getAgenda);
router.get('/agenda/:id', agendaController.getAgendaById);

//radioController
router.get('/radios', radioController.getRadios);
router.get('/radios/:id', radioController.getRadioById);
router.post('/radios', radioController.postRadio);
router.put('/radios/:id', radioController.putRadio);
router.delete('/radios/:id', radioController.deleteRadio);

//eventController
router.get('/eventos', eventController.getManualEvents);
router.get('/eventos/:id', eventController.getManualEventById);
router.post('/eventos', eventController.postManualEvent);
router.put('/eventos/:id', eventController.putManualEvent);
router.delete('/eventos/:id', eventController.deleteManualEvent);

//updateController
router.get('/novedades', updateController.getUpdates);
router.get('/novedades/:id', updateController.getUpdateById);
router.post('/novedades', updateController.postUpdate);
router.put('/novedades/:id', updateController.putUpdate);
router.delete('/novedades/:id', updateController.deleteUpdate);

//Para actualizar en el futuro
router.get('/ligas', indexController.getLigas);
router.get('/non-spanish-radios', indexController.getRadiosMap);
router.get('/league-map', indexController.getLeagueMap);
router.get('/team-map', indexController.getTeamMap);

export default router;