import { Router } from "express";
import authController from"../Controller/authController.js";
import indexController from "../Controller/indexController.js";
import agendaController from "../Controller/agendaController.js";
import radioController from "../Controller/radioController.js";
import eventController from "../Controller/eventController.js";
import updateController from "../Controller/updateController.js";
import visitController from "../Controller/visitController.js";
import passport from "passport";
import { loginLimiter, registerLimiter } from "../middlewareRateLimit.js";
import { requireAdmin } from "../middlewareAdminAuth.js";

const router=Router();

//Auth
router.post('/auth/register', registerLimiter, authController.postUser);
router.post('/auth/login', loginLimiter, authController.postLogin);

//agendaController
router.get('/agenda', agendaController.getAgenda);
router.get('/agenda/:id', agendaController.getAgendaById);

//radioController
router.get('/radios', radioController.getRadios);
router.get('/radios/:id', radioController.getRadioById);
router.post('/radios', passport.authenticate("jwt", { session: false }), requireAdmin, radioController.postRadio);
router.put('/radios/:id', passport.authenticate("jwt", { session: false }), requireAdmin, radioController.putRadio);
router.delete('/radios/:id', passport.authenticate("jwt", { session: false }), requireAdmin, radioController.deleteRadio);

//eventController
router.get('/eventos', eventController.getManualEvents);
router.get('/eventos/:id', eventController.getManualEventById);
router.post('/eventos', passport.authenticate("jwt", { session: false }), requireAdmin, eventController.postManualEvent);
router.put('/eventos/:id', passport.authenticate("jwt", { session: false }), requireAdmin, eventController.putManualEvent);
router.delete('/eventos/:id', passport.authenticate("jwt", { session: false }), requireAdmin, eventController.deleteManualEvent);

//updateController
router.get('/novedades', updateController.getUpdates);
router.get('/novedades/:id', updateController.getUpdateById);
router.post('/novedades', passport.authenticate("jwt", { session: false }), requireAdmin, updateController.postUpdate);
router.put('/novedades/:id', passport.authenticate("jwt", { session: false }), requireAdmin, updateController.putUpdate);
router.delete('/novedades/:id', passport.authenticate("jwt", { session: false }), requireAdmin, updateController.deleteUpdate);

//stats de visitas
router.get('/stats/visits', passport.authenticate("jwt", { session: false }), requireAdmin, visitController.getVisits);
router.post('/stats/visits', passport.authenticate("jwt", { session: false }), requireAdmin, visitController.postVisit);

//Para actualizar en el futuro
router.get('/ligas', indexController.getLigas);
router.get('/league-map', indexController.getLeagueMap);
router.get('/team-map', indexController.getTeamMap);

export default router;