import { Router } from "express";
import indexController from "../Controller/indexController.js";

const router=Router();

router.get('/agenda', indexController.getAgenda);
router.get('/radios', indexController.getRadios);
router.post('/radios', indexController.postRadios);
router.get('/eventos', indexController.getEventos);
router.get('/ligas', indexController.getLigas);
router.get('/novedades', indexController.getNovedades);
router.get('/non-spanish-radios', indexController.getRadiosMap);
router.get('/league-map', indexController.getLeagueMap);
router.get('/team-map', indexController.getTeamMap);

export default router;