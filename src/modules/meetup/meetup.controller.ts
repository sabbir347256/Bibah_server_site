import { Request, Response } from "express";
import QueryBuilder from "../utils/queryBuilder";
import { Meetup } from "./meetup.model";

const createMeetup = async (req: Request, res: Response) => {
  try {
    const meetupData = { ...req.body, user: (req as any).user?._id };
    const result = await Meetup.create(meetupData);
    res.status(201).json({ success: true, message: "Meetup requested successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllMeetups = async (req: Request, res: Response) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields", "fromDate", "toDate"];
    excludeFields.forEach((el) => delete queryObj[el]);

    const baseQuery = Meetup.find(queryObj)
      .populate({
        path: "user",
        select: "contactNo fullName"
      });

    const meetupQuery = new QueryBuilder(baseQuery, req.query)
      .search(["userId", "targetUserId", "mobileNumber"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const rawResult = await meetupQuery.modelQuery;
    const meta = await meetupQuery.countTotal();

    const result = await Promise.all(
      rawResult.map(async (doc: any) => {
        const docObj = doc.toObject();

        const [applicantUser, targetUser] = await Promise.all([
          doc.model("User").findOne({ userID: doc.userId }).select("contactNo fullName").lean(),
          doc.model("User").findOne({ userID: doc.targetUserId }).select("contactNo fullName").lean()
        ]);

        docObj.applicantUser = applicantUser || null;
        docObj.targetUser = targetUser || null;

        return docObj;
      })
    );

    res.status(200).json({ success: true, meta, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMeetup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Meetup.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Meetup request deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const meetupController = {
  createMeetup,
  getAllMeetups,
  deleteMeetup
}