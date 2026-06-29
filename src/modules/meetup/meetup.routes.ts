import { Router } from "express";
import { meetupController } from './meetup.controller';

const router = Router();

router.post("/postMeetup", meetupController.createMeetup);
router.get("/",meetupController.getAllMeetups);
router.delete("/:id", meetupController.deleteMeetup);

export const MeetupRoutes = router;