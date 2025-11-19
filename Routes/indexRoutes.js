import { Router } from "express";
import indexController from "../Controller/indexController.js";
import agendaController from "../Controller/agendaController.js";
import radioController from "../Controller/radioController.js";

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

router.get('/eventos', indexController.getEventos);
router.get('/ligas', indexController.getLigas);
router.get('/novedades', indexController.getNovedades);
router.get('/non-spanish-radios', indexController.getRadiosMap);
router.get('/league-map', indexController.getLeagueMap);
router.get('/team-map', indexController.getTeamMap);

export default router;