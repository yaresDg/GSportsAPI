import { Router } from "express";
import authController from"../Controller/authController.js";
import indexController from "../Controller/indexController.js";
import agendaController from "../Controller/agendaController.js";
import radioController from "../Controller/radioController.js";
import eventController from "../Controller/eventController.js";
import updateController from "../Controller/updateController.js";
import { verifyToken } from "../middlewareToken.js";

const router=Router();

//Auth
router.post('/auth/register',authController.postUser);
router.post('/auth/login',authController.postLogin);

//agendaController
router.get('/agenda', agendaController.getAgenda);
router.get('/agenda/:id', agendaController.getAgendaById);

//radioController
router.get('/radios', radioController.getRadios);
router.get('/radios/:id', radioController.getRadioById);
router.post('/radios', verifyToken, radioController.postRadio);
router.put('/radios/:id', verifyToken, radioController.putRadio);
router.delete('/radios/:id', verifyToken, radioController.deleteRadio);

//eventController
router.get('/eventos', eventController.getManualEvents);
router.get('/eventos/:id', eventController.getManualEventById);
router.post('/eventos', verifyToken, eventController.postManualEvent);
router.put('/eventos/:id', verifyToken, eventController.putManualEvent);
router.delete('/eventos/:id', verifyToken, eventController.deleteManualEvent);

//updateController
router.get('/novedades', updateController.getUpdates);
router.get('/novedades/:id', updateController.getUpdateById);
router.post('/novedades', verifyToken, updateController.postUpdate);
router.put('/novedades/:id', verifyToken, updateController.putUpdate);
router.delete('/novedades/:id', verifyToken, updateController.deleteUpdate);

//Para actualizar en el futuro
router.get('/ligas', indexController.getLigas);
router.get('/league-map', indexController.getLeagueMap);
router.get('/team-map', indexController.getTeamMap);

export default router;